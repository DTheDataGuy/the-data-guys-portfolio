require 'minitest/autorun'
require 'tmpdir'
require_relative 'reconcile'

class ReconcileTest < Minitest::Test
  def setup
    @base=File.realpath(Dir.mktmpdir('reconcile-',File.realpath('/tmp')))
    @home=File.join(@base,'home')
    @cloud=File.join(@home,'Library/Mobile Documents/com~apple~CloudDocs')
    @guide=File.join(@cloud,'00 Start Here - File Guide')
    @tool=File.join(@guide,'Restore Layout')
    FileUtils.mkdir_p(@tool)
    @r=Reconciler.new(@home,@tool)
    @r.define_singleton_method(:office_running?){false}
    @r.core.define_singleton_method(:open_files){Set.new}
  end
  def teardown
    FileUtils.remove_entry(@base)
  end
  def file(name,contents='latest contents')
    path=File.join(@cloud,name);FileUtils.mkdir_p(File.dirname(path));File.write(path,contents);path
  end
  def history_for(path,target)
    run=File.join(@guide,'Finish Filing/Runs/original-run')
    FileUtils.mkdir_p(run)
    fp=CompleteFiling.signature(path)
    plan={'operations'=>[{'id'=>1,'source'=>path,'destination'=>target,'tree'=>{'.'=>fp}}]}
    File.write(File.join(run,'plan.json'),JSON.generate(plan))
    File.write(File.join(run,'journal.jsonl'),JSON.generate({'event'=>'moved_verified','id'=>1})+"\n")
  end
  def test_restore_code_member_to_exact_collection
    p=file('main.js')
    target=File.join(@cloud,'08 Data & Code/Workspaces/iCloud Loose Workspace/Client G/src/main.js')
    history_for(p,target)
    run,plan=@r.plan
    assert_equal target,plan['operations'].first['destination']
    @r.apply(run,plan)
    refute File.exist?(p)
    assert_equal 'latest contents',File.read(target)
    assert File.file?(File.join(@guide,'CURRENT FILE INDEX.csv'))
    assert File.file?(File.join(@guide,'HISTORICAL FILE AUDIT.csv'))
    assert File.read(File.join(run,'Historical-file-audit.csv')).include?('AT_RECORDED_LOCATION')
    assert File.read(File.join(@guide,'START HERE.md')).include?('Recents is not')
  end
  def test_modified_contents_preserved
    p=file('budget.pdf','old')
    target=File.join(@cloud,'07 Working Materials/Finance and Administration/budget.pdf')
    history_for(p,target)
    File.write(p,'current edited version')
    run,plan=@r.plan;@r.apply(run,plan)
    assert_equal 'current edited version',File.read(target)
  end
  def test_existing_destination_keeps_both
    p=file('report.pdf','returned')
    target=file('07 Working Materials/Reports and Planning/report.pdf','already here')
    history_for(p,target)
    run,plan=@r.plan
    assert_includes plan['operations'].first['destination'],'retained copy'
    @r.apply(run,plan)
    assert_equal 'already here',File.read(target)
    assert_equal 'returned',File.read(plan['operations'].first['destination'])
  end
  def test_unknown_file_has_fallback_without_fabricated_identity
    p=file('report.pdf'); target=File.join(@cloud,'07 Working Materials/Reports and Planning/report.pdf')
    history_for(p,target)
    file('123456789.pdf','new')
    _,plan=@r.plan
    o=plan['operations'].find{|x|File.basename(x['source'])=='123456789.pdf'}
    assert_nil o['historical_target']
    assert_includes o['destination'],'10 Filed Documents/PDF Documents'
  end
  def test_missing_prior_items_not_recreated
    p=file('report.pdf'); target=File.join(@cloud,'07 Working Materials/Reports and Planning/report.pdf')
    history_for(p,target)
    File.rename(p,File.join(@base,'removed-by-user.pdf'))
    _,plan=@r.plan
    assert_empty plan['operations']
    refute File.exist?(target)
  end
  def test_undo_restores_returned_location
    p=file('main.js');target=File.join(@cloud,'08 Data & Code/Workspaces/project/src/main.js')
    history_for(p,target)
    run,plan=@r.plan;@r.apply(run,plan);@r.undo(run,plan)
    assert_equal 'latest contents',File.read(p)
    refute File.exist?(target)
  end
  def test_does_not_use_unexecuted_plan_rows
    p=file('report.pdf');target=File.join(@cloud,'planned-but-not-executed/report.pdf')
    history_for(p,target)
    run=File.join(@guide,'Finish Filing/Runs/original-run')
    File.write(File.join(run,'journal.jsonl'),'')
    assert_raises(RuntimeError){@r.plan}
  end
  def test_missing_history_stops
    file('untitled.pdf')
    assert_raises(RuntimeError){@r.plan}
  end
end
