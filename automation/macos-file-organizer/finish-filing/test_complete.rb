require 'minitest/autorun'
require 'tmpdir'
require_relative 'complete_organizer'

class CompleteTest < Minitest::Test
  def setup
    @base=File.realpath(Dir.mktmpdir('filing-complete-',File.realpath('/tmp')))
    @home=File.join(@base,'home')
    @cloud=File.join(@home,'Library/Mobile Documents/com~apple~CloudDocs')
    @tools=File.join(@cloud,'00 Start Here - File Guide/Finish Filing')
    FileUtils.mkdir_p(@tools)
    @runner=CompleteFiling::Runner.new(@home,@tools)
    @runner.define_singleton_method(:office_running?){false}
    @runner.core.define_singleton_method(:open_files){Set.new}
  end
  def teardown
    FileUtils.remove_entry(@base)
  end
  def file(name,data='contents',root=@cloud)
    path=File.join(root,name);FileUtils.mkdir_p(File.dirname(path));File.write(path,data)
    File.utime(Time.now-86400*30,Time.now-86400*30,path)
    path
  end
  def test_full_clear_and_full_restore
    paths=[file('budget.pdf'),file('Untitled.docx'),file('image.png'),file('future.ics'),file('secret credentials.txt'),
      file('table.xlsx'),file('dash.pbix'),file('data.csv'),file('~$draft.docx'),file('unknown.xyz')]
    file('repo/.git/config');file('repo/src/main.js')
    run,p=@runner.plan
    assert_equal 11,p['operations'].length
    paths.each{|x|assert File.exist?(x)}
    @runner.apply(run,p)
    paths.each{|x|refute File.exist?(x)}
    assert CSV.read(File.join(run,'Remaining-loose-files.csv'),:headers=>true).empty?
    assert p['operations'].all?{|o|CompleteFiling.same_tree?(o['destination'],o['tree'])}
    @runner.undo(run,p)
    paths.each{|x|assert File.exist?(x)}
    assert File.exist?(File.join(@cloud,'repo/.git/config'))
  end
  def test_source_bundle_keeps_spreadsheet_and_code_together
    a=file('Cascade Civil WIP.xlsx'); b=file('data.csv'); c=file('main.py')
    _,p=@runner.plan
    parents=p['operations'].map{|o|File.dirname(o['destination'])}.uniq
    assert_equal 1,parents.length
    assert_includes parents.first,'iCloud Loose Workspace'
    topics=p['operations'].map{|o|o['topic']}
    assert topics.any?{|s|s.include?('Cascade Civil')}
  end
  def test_existing_numbered_groups_and_app_paths_not_selected
    file('Adobe/settings.xml');file('My Tableau Repository/preferences.txt')
    file('01 The Data Guys/Existing.pdf');file('Desktop/a.pdf')
    file('Test.app/Contents/info.plist')
    _,p=@runner.plan
    assert_empty p['operations']
  end
  def test_collection_hidden_files_move_intact
    file('Client G/backend/.env','not a real credential')
    a=file('Client G/backend/main.js')
    run,p=@runner.plan
    o=p['operations'].first
    @runner.apply(run,p)
    assert_equal 'not a real credential',File.read(File.join(o['destination'],'backend/.env'))
    refute File.exist?(a)
  end
  def test_symlink_inside_collection_retained_without_following
    outside=file('outside.txt', 'elsewhere',@base)
    file('Collection/a.pdf')
    File.symlink(outside,File.join(@cloud,'Collection/linked'))
    run,p=@runner.plan
    @runner.apply(run,p)
    d=p['operations'].first['destination']
    assert File.symlink?(File.join(d,'linked'))
    assert_equal outside,File.readlink(File.join(d,'linked'))
    assert_equal 'elsewhere',File.read(outside)
  end
  def test_top_level_symlink_not_moved
    a=file('a.txt','external',@base);File.symlink(a,File.join(@cloud,'shortcut'))
    _,p=@runner.plan
    assert_empty p['operations']
    assert_equal 1,p['exceptions'].length
  end
  def test_lock_gate_stops_before_all_moves
    a=file('~$doc.docx');file('bill.pdf')
    run,p=@runner.plan
    @runner.define_singleton_method(:office_running?){true}
    assert_raises(RuntimeError){@runner.apply(run,p)}
    assert File.exist?(a)
    assert_empty @runner.core.read_journal(run)
  end
  def test_changed_collection_skipped
    a=file('Project/report.pdf')
    run,p=@runner.plan
    File.write(a,'changed')
    @runner.apply(run,p)
    assert File.exist?(a)
    assert @runner.core.read_journal(run).any?{|e|e['event']=='skipped'}
  end
  def test_open_collection_skipped
    a=file('Project/report.pdf')
    run,p=@runner.plan
    @runner.core.define_singleton_method(:open_files){Set.new([a])}
    @runner.apply(run,p)
    assert File.exist?(a)
  end
  def test_same_name_versions_not_deduped
    a=file('report.pdf','aaaa');b=file('report (1).pdf','bbbb')
    run,p=@runner.plan
    @runner.apply(run,p)
    assert_equal 2,p['operations'].length
    assert_equal %w[aaaa bbbb],p['operations'].map{|o|File.read(o['destination'])}.sort
  end
  def test_hardlinks_both_filed
    a=file('a.pdf');File.link(a,File.join(@cloud,'b.pdf'))
    run,p=@runner.plan
    assert_equal 2,p['operations'].length
    @runner.apply(run,p)
    refute File.exist?(a)
    refute File.exist?(File.join(@cloud,'b.pdf'))
  end
  def test_installer_app_staged_not_deleted
    file('iMyFone VoxBox Installer.app/Contents/info.plist')
    run,p=@runner.plan
    assert_includes p['operations'].first['category'],'Installers'
    @runner.apply(run,p)
    assert File.exist?(File.join(p['operations'].first['destination'],'Contents/info.plist'))
  end
  def test_destination_collision_after_plan
    a=file('report.pdf')
    run,p=@runner.plan
    d=p['operations'].first['destination'];FileUtils.mkdir_p(File.dirname(d));File.write(d,'new')
    @runner.apply(run,p)
    assert_equal 'new',File.read(d)
    assert File.exist?(a)
  end
  def test_newer_download_skipped
    a=file('something.crdownload')
    File.utime(Time.now,Time.now,a)
    run,p=@runner.plan;@runner.apply(run,p)
    assert File.exist?(a)
  end
  def test_undo_will_not_overwrite_or_lose_edits
    a=file('bill.pdf')
    run,p=@runner.plan;@runner.apply(run,p)
    d=p['operations'].first['destination']
    File.write(a,'new');@runner.undo(run,p)
    assert_equal 'new',File.read(a);assert File.exist?(d)
  end
  def test_unknown_documents_honest_category
    a=file('123456789.pdf')
    _,p=@runner.plan
    assert_includes p['operations'].first['category'],'PDF Documents'
    refute_includes p['operations'].first['category'],'The Data Guys'
  end
  def test_resource_pair_same_parent
    a=file('Page.html');file('Page_files/style.css')
    run,p=@runner.plan
    parents=p['operations'].map{|o|File.dirname(o['destination'])}.uniq
    assert_equal 1,parents.length
    @runner.apply(run,p)
    assert p['operations'].all?{|o|CompleteFiling.same_tree?(o['destination'],o['tree'])}
  end
  def test_unknown_folder_preserved_as_collection
    file('Important Collection/a.pdf')
    _,p=@runner.plan
    assert_includes p['operations'].first['category'],'Preserved Collections'
    assert_equal 'directory',p['operations'].first['kind']
  end
  def test_security_file_contents_not_read_for_classification
    a=file('passwords.txt','never print this')
    _,p=@runner.plan
    assert_includes p['operations'].first['category'],'Security'
    refute File.read(File.join(File.dirname(Dir.glob(File.join(@tools,'Runs','*','plan.json')).first),'Preview.csv')).include?('never print this')
  end
end
