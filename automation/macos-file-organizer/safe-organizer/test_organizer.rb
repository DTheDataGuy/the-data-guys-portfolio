require 'minitest/autorun'
require 'tmpdir'
require_relative 'organizer'

ENV['FILING_TEST_MODE']='1'

class OrganizerTest < Minitest::Test
  def setup
    @base=File.realpath(Dir.mktmpdir('filing-test-',File.realpath('/tmp')))
    @home=File.join(@base,'home')
    @cloud=File.join(@home,'Library/Mobile Documents/com~apple~CloudDocs')
    @tools=File.join(@cloud,'00 Start Here - File Guide/Organizer v2')
    FileUtils.mkdir_p(@tools)
    @org=Filing::Organizer.new(@home,@tools)
    # Fixtures contain only temporary synthetic files. Do not inspect real apps.
    @org.define_singleton_method(:open_files) { Set.new }
    @old=Time.now-172800
  end
  def teardown
    FileUtils.remove_entry(@base)
  end
  def put(rel,data='original')
    p=File.join(@home,rel)
    FileUtils.mkdir_p(File.dirname(p))
    File.write(p,data)
    File.utime(@old,@old,p)
    p
  end
  def cloudfile(name,data='original')
    put('Library/Mobile Documents/com~apple~CloudDocs/'+name,data)
  end
  def preview
    run,_=@org.preview
    [run,JSON.parse(File.read(File.join(run,'plan.json')))]
  end
  def test_preview_does_not_move_and_apply_and_undo
    p=cloudfile('CTAB meeting.pdf')
    run,plan=preview
    r=plan['rows'].find { |x| x['path']==p }
    assert_equal 'MOVE',r['action']
    assert File.exist?(p)
    refute File.exist?(r['destination'])
    @org.apply(run,plan)
    refute File.exist?(p)
    assert_equal 'original',File.read(r['destination'])
    idx=CSV.read(File.join(run,'Where-Everything-Is.csv'),:headers=>true)
    assert idx.any? { |x| x['Verification']=='MOVED_VERIFIED' }
    @org.undo(run,plan)
    assert_equal 'original',File.read(p)
    refute File.exist?(r['destination'])
  end
  def test_versions_all_retained
    a=cloudfile('NAACP Agenda.pdf','aaaa')
    b=cloudfile('NAACP Agenda (1).pdf','bbbb')
    run,plan=preview
    assert_equal 2,plan['rows'].count { |r| r['action']=='MOVE' }
    @org.apply(run,plan)
    destinations=plan['rows'].select { |r| r['action']=='MOVE' }.map { |r| r['destination'] }
    assert_equal %w[aaaa bbbb],destinations.map { |p| File.read(p) }.sort
    assert destinations.none? { |p| p.include?('Deletion') }
  end
  def test_collision_never_overwritten
    a=cloudfile('CTAB Agenda.pdf','move me')
    existing=cloudfile('02 Civic & Community/Seattle CTAB/CTAB Agenda.pdf','keep me')
    run,plan=preview
    r=plan['rows'].find { |x| x['path']==a }
    assert_includes r['destination'],'[retained copy 2]'
    @org.apply(run,plan)
    assert_equal 'keep me',File.read(existing)
  end
  def test_collision_after_preview_skips
    a=cloudfile('CTAB Agenda.pdf')
    run,plan=preview
    r=plan['rows'].find { |x| x['path']==a }
    FileUtils.mkdir_p(File.dirname(r['destination']))
    File.write(r['destination'],'new arrival')
    @org.apply(run,plan)
    assert File.exist?(a)
    assert_equal 'new arrival',File.read(r['destination'])
  end
  def test_changed_source_skips
    a=cloudfile('CTAB Agenda.pdf')
    run,plan=preview
    File.write(a,'edited since preview')
    @org.apply(run,plan)
    assert File.exist?(a)
    assert @org.read_journal(run).any? { |e| e['event']=='skipped' }
  end
  def test_undo_does_not_overwrite_new_original
    a=cloudfile('CTAB Agenda.pdf')
    run,plan=preview
    @org.apply(run,plan)
    File.write(a,'new original')
    @org.undo(run,plan)
    assert_equal 'new original',File.read(a)
    assert File.exist?(plan['rows'].find { |r| r['path']==a }['destination'])
  end
  def test_undo_does_not_move_edited_destination
    a=cloudfile('CTAB Agenda.pdf')
    run,plan=preview
    @org.apply(run,plan)
    d=plan['rows'].find { |r| r['path']==a }['destination']
    File.write(d,'edited')
    @org.undo(run,plan)
    refute File.exist?(a)
    assert_equal 'edited',File.read(d)
  end
  def test_dependencies_sensitive_recent_and_ambiguous_preserved
    files=[
      cloudfile('Cascade Civil WIP.xlsx'),
      cloudfile('CTAB analysis.csv'),
      cloudfile('CTAB presentation.ai'),
      cloudfile('CTAB and CDCPDA.pdf'),
      cloudfile('passwords.txt'),
      cloudfile('tax return.pdf'),
      cloudfile('~$CTAB minutes.docx'),
      cloudfile('meeting.ics'),
      cloudfile('other.pdf'),
      cloudfile('CTAB Active.pdf')
    ]
    File.utime(Time.now,Time.now,files.last)
    _,plan=preview
    files.each { |p| assert_equal 'KEEP',plan['rows'].find { |r| r['path']==p }['action'],p }
  end
  def test_existing_structures_and_packages_preserved
    nested=cloudfile('Current Project/CTAB Agenda.pdf')
    secret=put('Pictures/Photos Library.photoslibrary/internal.db')
    link=File.join(@cloud,'linked')
    File.symlink(File.dirname(secret),link)
    _,plan=preview
    assert_equal 'KEEP',plan['rows'].find { |r| r['path']==nested }['action']
    refute plan['rows'].any? { |r| r['path']==secret }
    assert_equal 'symlink',plan['rows'].find { |r| r['path']==link }['kind']
  end
  def test_recording_year_and_no_hashing
    a=cloudfile('Screen Recording 2025-07-31 at 7.56.53 AM.mov')
    _,plan=preview
    r=plan['rows'].find { |x| x['path']==a }
    assert_includes r['destination'],'Screen Recordings/2025/'
  end
  def test_classification_avoids_keyword_substrings
    ['NMFApplicationWorksheet.pdf','Secretary Report.pdf','council Board_Members.xlsx','certificate of compliance.pdf','July budget.pdf'].each do |n|
      _,confidence,_=Filing.classify(n,@old.to_f)
      assert_equal 'review',confidence,n
    end
    assert_includes Filing.classify('CDCPDA operating budget.pdf',@old.to_f)[0],'CDCPDA'
    assert_includes Filing.classify('Scisney_Resume_NAACP.pdf',@old.to_f)[0],'Career'
  end
  def test_case_collision
    a=cloudfile('CTAB Agenda.pdf')
    b=put('Downloads/ctab agenda.pdf')
    _,plan=preview
    ds=plan['rows'].select { |r| [a,b].include?(r['path']) }.map { |r| r['destination'].downcase }
    assert_equal 2,ds.uniq.size
  end
  def test_atomic_move_exclusive
    a=cloudfile('a.txt','a')
    b=cloudfile('b.txt','b')
    assert_raises(RuntimeError) { Filing.atomic_move(a,b) }
    assert_equal 'a',File.read(a)
    assert_equal 'b',File.read(b)
  end
  def test_destination_symlink_is_blocked
    a=cloudfile('CTAB Agenda.pdf')
    run,plan=preview
    File.symlink(@base,File.join(@cloud,'02 Civic & Community'))
    assert_raises(RuntimeError) { @org.apply(run,plan) }
    assert File.exist?(a)
  end
  def test_malformed_destination_is_blocked
    cloudfile('CTAB Agenda.pdf')
    run,plan=preview
    plan['rows'].find { |r| r['action']=='MOVE' }['destination']=File.join(@base,'escape.pdf')
    assert_raises(RuntimeError) { @org.apply(run,plan) }
  end
  def test_recover_intent_without_completed_log
    a=cloudfile('CTAB Agenda.pdf')
    run,plan=preview
    r=plan['rows'].find { |x| x['path']==a }
    FileUtils.mkdir_p(File.dirname(r['destination']))
    @org.append_event(run,{'event'=>'intent','id'=>r['id'],'source'=>a,'destination'=>r['destination'],'fingerprint'=>r['fingerprint']})
    Filing.atomic_move(a,r['destination'])
    @org.undo(run,plan)
    assert File.exist?(a)
  end
  def test_csv_formula_injection
    assert_equal "'=HYPERLINK(\"evil\")",@org.csv_cell('=HYPERLINK("evil")')
    assert_equal "'-file.pdf",@org.csv_cell('-file.pdf')
  end
  def test_plan_file_idempotent
    a=cloudfile('CTAB Agenda.pdf')
    run,plan=preview
    assert_equal 1,@org.apply(run,plan)
    assert_equal 0,@org.apply(run,plan)
    assert_equal 1,@org.read_journal(run).count { |e| e['event']=='moved_verified' }
  end
end
