#!/usr/bin/env ruby
require_relative 'complete_organizer'

class Reconciler < CompleteFiling::Runner
  def historical_targets
    map=Hash.new{|h,k|h[k]=[]}
    guide=File.join(cloud,'00 Start Here - File Guide')
    r1=Dir.glob(File.join(guide,'Organizer v2','Runs','*')).sort
    r1.each do |run|
      path=File.join(run,'approved-plan.json')
      next unless File.file?(path)
      completed=core.read_journal(run).select{|e|e['event']=='moved_verified'}.map{|e|e['id']}.to_set
      p=JSON.parse(File.read(path))
      p['rows'].each do |r|
        next unless completed.include?(r['id']) && r['action']=='MOVE'
        fp=r['fingerprint']
        map[[fp['dev'],fp['ino']]] << r['destination']
      end
    end
    Dir.glob(File.join(guide,'Finish Filing','Runs','*')).sort.each do |run|
      path=File.join(run,'plan.json')
      next unless File.file?(path)
      completed=core.read_journal(run).select{|e|e['event']=='moved_verified'}.map{|e|e['id']}.to_set
      p=JSON.parse(File.read(path))
      p['operations'].each do |o|
        next unless completed.include?(o['id'])
        (o['tree']||{}).each do |rel,fp|
          next unless fp['kind']=='file'
          target=rel=='.' ? o['destination'] : File.join(o['destination'],rel)
          map[[fp['dev'],fp['ino']]] << target
        end
      end
    end
    # Subsequent successful repairs supersede older expected paths for the same
    # physical file, including deliberately retained collision copies.
    Dir.glob(File.join(tool,'Runs','*')).sort.each do |run|
      path=File.join(run,'plan.json')
      next unless File.file?(path)
      completed=core.read_journal(run).select{|e|e['event']=='moved_verified'}.map{|e|e['id']}.to_set
      p=JSON.parse(File.read(path))
      Array(p['operations']).each do |o|
        next unless completed.include?(o['id'])&&o['kind']=='file'
        fp=(o['tree']||{})['.'];next unless fp
        map[[fp['dev'],fp['ino']]]=[o['destination']]
      end
    end
    map.transform_values(&:uniq)
  end

  def target_for(path,tree,map)
    fp=tree['.']
    targets=Array(map[[fp['dev'],fp['ino']]])
    return targets.first if targets.length==1
    exact=targets.select{|d|File.basename(d)==File.basename(path)}
    exact.length==1 ? exact.first : nil
  end

  def plan
    run=core.create_run
    puts 'Reading successful move histories to recover exact filing destinations...'
    history=historical_targets
    puts "Historical identities: #{history.length}"
    raise 'No successful filing history found; stop rather than guess how to rebuild project folders.' if history.empty?
    operations,exceptions=candidates
    reserved=Set.new
    operations.each_with_index do |o,i|
      s=o['source'];o['id']=i+1
      begin
        o['tree']=CompleteFiling.tree(s)
        if o['kind']=='file' && (exact=target_for(s,o['tree'],history))
          if Filing.within?(exact,cloud) && !Filing.within?(exact,File.join(cloud,'00 Start Here - File Guide'))
            o['category']=File.dirname(exact)[(cloud.length+1)..-1]
            o['reason']='Return this file identity to its prior verified destination, preserving its current contents.'
            o['historical_target']=exact
          end
        end
      rescue SystemCallError=>e
        o['blocked']=e.message
      end
      dest=o['historical_target']||File.join(cloud,o['category'],File.basename(s))
      stem=File.basename(dest,File.extname(dest));ext=File.extname(dest);parent=File.dirname(dest);k=2
      if o['kind']=='directory';stem=File.basename(dest);ext='';end
      # Preserve all current copies. Existing destinations are never overwritten.
      while reserved.include?(dest.downcase)||File.exist?(dest)||File.symlink?(dest)
        dest=File.join(parent,"#{stem} [retained copy #{k}]#{ext}");k+=1
      end
      reserved<<dest.downcase
      o['destination']=dest
      o['reason']+=' Existing destination occupied; retain this version separately.' if o['historical_target'] && dest!=o['historical_target']
      puts "Mapped #{i+1} items..." if (i+1)%200==0
    end
    p={'home'=>home,'cloud'=>cloud,'created'=>Time.now.iso8601,'operations'=>operations,'exceptions'=>exceptions}
    core.write_json(File.join(run,'plan.json'),p)
    core.write_csv(File.join(run,'Preview.csv'),%w[ID Name Current_location Destination Reason Historical_target],
      operations.map{|o|[o['id'],File.basename(o['source']),o['source'],o['destination'],o['reason'],o['historical_target']]})
    File.write(File.join(run,'Preview.md'),"# Reconciliation preview\n\n"+
      "#{operations.length} items selected; #{operations.count{|o|o['historical_target']}} matched by filesystem identity to a prior verified destination.\n\n"+
      "Current file contents are retained, including edits. No content is restored from an old copy. Unrecognized loose files use the existing filing rules. Existing destinations are never overwritten. Missing or previously removed cleanup items are not recovered from Trash. No deletions or duplicate removal.\n")
    [run,p]
  end

  def verify(run,p)
    states=super
    puts 'Cross-checking every historical file identity against the current inventory...'
    snap=core.snapshot
    current=Hash.new{|h,k|h[k]=[]}
    snap['entries'].each do |e|
      next unless e['kind']=='file'
      fp=e['fingerprint'];current[[fp['dev'],fp['ino']]]<<e['path']
    end
    history=historical_targets
    audit=[]
    history.each_with_index do |(id,targets),i|
      locations=current[id]
      # Hidden project members may be absent from the general user-facing index.
      # Read their metadata at known historical paths without opening content.
      if locations.empty?
        targets.each do |t|
          begin
            st=File.lstat(t)
            locations << t if st.file? && [st.dev,st.ino]==id
          rescue SystemCallError
          end
        end
      end
      status=if locations.any?{|x|targets.include?(x)}
        'AT_RECORDED_LOCATION'
      elsif !locations.empty?
        'LOCATED_ELSEWHERE_REVIEW'
      elsif targets.all?{|t|t.include?('/99 To Review for Deletion/')}
        'PRIOR_CLEANUP_ITEM_NOT_LOCATED'
      else
        'PRIOR_ITEM_NOT_LOCATED_REVIEW'
      end
      audit<<[id.join(':'),status,targets.join(' | '),locations.uniq.join(' | ')]
      puts "History checked: #{i+1} file identities..." if (i+1)%2000==0
    end
    core.write_csv(File.join(run,'Historical-file-audit.csv'),%w[Filesystem_identity Status Recorded_locations Current_locations],audit)
    counts=audit.group_by{|a|a[1]}.transform_values(&:length)
    File.open(File.join(run,'Verification.md'),'a') do |f|
      f.write("\n## Historical-file cross-check\n\n")
      counts.each{|status,count|f.write("- #{status}: #{count}\n")}
      f.write("\nAn item not located is not proof of deletion. It may have been removed, copied with a new identity, moved outside the scanned locations, or changed by synchronization. Missing history is reported, never silently treated as complete. This check uses identity and metadata, not file-content hashes.\n")
    end
    puts "HISTORY AUDIT: #{counts}"
    # Refresh the primary navigation files, not the original historical journals.
    guide=File.join(cloud,'00 Start Here - File Guide')
    FileUtils.mkdir_p(guide)
    src=File.join(run,'Where-Everything-Is.csv')
    FileUtils.cp(src,File.join(guide,'CURRENT FILE INDEX.csv'))
    FileUtils.cp(File.join(run,'Remaining-loose-files.csv'),File.join(guide,'CURRENT EXCEPTIONS.csv'))
    FileUtils.cp(File.join(run,'Historical-file-audit.csv'),File.join(guide,'HISTORICAL FILE AUDIT.csv'))
    paths=Dir.children(cloud).reject{|n|n.start_with?('.')}.select{|n|File.directory?(File.join(cloud,n))}
    descriptions={
      '01 The Data Guys'=>'Company work, named projects and business materials.',
      '02 Civic & Community'=>'Boards, civic organizations and community programs.',
      '03 FIFA World Cup & Sports'=>'World Cup and sports-related work.',
      '04 Career & Professional'=>'Career documents, résumés and applications.',
      '05 Personal'=>'Personal, property and security-related records.',
      '06 Media'=>'Photos, screenshots, recordings, videos and audio.',
      '07 Archives'=>'Older computer collections and downloaded archives, kept intact.',
      '07 Working Materials'=>'Cross-project finance, contracts, proposals, meetings and training.',
      '08 Data & Code'=>'Data, code and design workspaces; preserve internal relationships.',
      '09 Reference & Research'=>'Research and technical reference material.',
      '10 Filed Documents'=>'Other documents filed by type and modification year.',
      '99 To Review for Deletion'=>'Preserved cleanup candidates, not automatically deleted.'
    }
    text="# Your iCloud Filing Guide\n\nUpdated #{Time.now.iso8601}.\n\n"
    text<<"## Start here\n\nYour personal documents and ordinary media belong in the numbered iCloud Drive folders. Open CURRENT FILE INDEX.csv to search by filename, category, topic or actual location. CURRENT EXCEPTIONS.csv lists visible loose files; HISTORICAL FILE AUDIT.csv separately identifies misplaced or unlocated historical items. A blank loose-file report is not a substitute for checking the history audit.\n\n"
    text<<"## Folder map\n\n"
    paths.sort.each{|n|text<<"- **#{n}:** #{descriptions[n]||'Navigation tools or an app-managed location; preserve in place.'}\n"}
    text<<"\n## Recents is not a storage location\n\nRecents is a Finder search view of actual files, including items already in iCloud. Do not drag all of Recents into iCloud or delete its contents to clean the view; those actions change the actual files. Use iCloud Drive for navigation and the path bar to check a selected item's actual location ([Apple Support Community](https://discussions.apple.com/thread/254063196)).\n\n"
    text<<"## Storage policy\n\nUse iCloud as the primary home for personal documents and ordinary media. Keep operating-system components, installed apps and app-managed libraries in supported locations. iCloud storage does not automatically mean no local disk usage. Apple's Optimize Mac Storage and Remove Download controls can reduce local storage, but only consider removing local downloads after synchronization is verified ([Apple Support](https://support.apple.com/guide/mac-help/work-with-folders-and-files-in-icloud-drive-mchl1a02d711/mac)).\n\n"
    text<<"## Preserve working relationships\n\nThe data/code workspace intentionally keeps many linked assets together. Search the Topic column of CURRENT FILE INDEX.csv instead of separating dependency files by appearance. Absolute references may need relinking after a move. The organizer does not rewrite formulas or application settings.\n\n"
    text<<"## Verification and limits\n\nLatest reconciliation reports: #{run.sub(cloud+'/','')}. Original run logs remain intact. Current locations are freshly indexed, but categories based on filenames are not a claim that every document's contents were reviewed. No files were permanently deleted by the organizer. Previously removed items are not restored from Trash. App package internals and hidden/system locations are not individually reorganized.\n\n"
    text<<"## Keep the system clean\n\nFile new material into its project or purpose folder. Leave Recents as a view, not a filing destination. Keep all versions until compared; matching names and sizes do not establish duplicates. Before another organizing run, close documents and avoid simultaneous Finder moves or restores.\n"
    File.write(File.join(guide,'START HERE.md'),text)
    states
  end
end

if __FILE__==$PROGRAM_NAME
  begin
    $stdout.sync=true
    raise 'macOS required' unless RUBY_PLATFORM.include?('darwin')
    runner=Reconciler.new
    File.open(File.join(runner.tool,'.reconcile.lock'),File::RDWR|File::CREAT,0600) do |lock|
      raise 'Another reconciliation is running' unless lock.flock(File::LOCK_EX|File::LOCK_NB)
      mode=ARGV.first||'preview'
      if %w[preview finish].include?(mode)
        run,p=runner.plan
        puts File.read(File.join(run,'Preview.md'))
        if mode=='finish'
          runner.apply(run,p)
          system('/usr/bin/open',runner.cloud)
          puts "\nFinished. Read Verification.md and CURRENT EXCEPTIONS.csv; do not assume a clean result without checking them."
        else
          puts 'PREVIEW ONLY: user files unchanged.'
        end
        puts "REPORTS=#{run}"
      elsif %w[verify undo].include?(mode)
        run=Dir.glob(File.join(runner.tool,'Runs','*')).select{|r|File.file?(File.join(r,'plan.json'))}.sort.last
        raise 'No reconciliation run exists' unless run
        p=JSON.parse(File.read(File.join(run,'plan.json')))
        if mode=='undo'
          puts 'Type UNDO to reverse unchanged files from this reconciliation only.'
          runner.undo(run,p) if STDIN.gets.to_s.strip=='UNDO'
        else
          runner.verify(run,p)
        end
      else
        raise 'Use preview, finish, verify or undo.'
      end
    end
  rescue Interrupt
    warn 'Stopped. Completed moves remain journaled; use verify before proceeding.'
  rescue StandardError=>e
    warn "STOPPED: #{e.message}"
    exit 1
  end
end
