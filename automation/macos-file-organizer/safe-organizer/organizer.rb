#!/usr/bin/env ruby
# Ruby 2.6 compatible. No gems, network calls, deletion or content downloads.
require 'json'
require 'csv'
require 'fileutils'
require 'time'
require 'securerandom'
require 'fiddle'
require 'set'

module Filing
  VERSION = '2.0.0'
  PACKAGE_EXT = %w[.app .photoslibrary .photolibrary .fcpbundle .library .band .logicx .pages .numbers .key .rtfd .scriv .sparsebundle]
  LINKED_EXT = %w[.xlsx .xls .xlsm .xlsb .csv .tsv .pbix .pbit .twb .twbx .hyper .sql .db .sqlite .ipynb .py .r .js .ts .html .htm .css .ai .psd .indd .prproj .aep .fig .dwg .blend .sh .command]
  SAFE_DOC_EXT = %w[.pdf .docx .doc .rtf .txt .pptx .ppt .odt]
  MEDIA_EXT = %w[.png .jpg .jpeg .heic .dng .gif .webp .tif .tiff .bmp .mov .mp4 .m4v .mp3 .m4a .wav .aac]
  IGNORE = %w[.DS_Store .localized]
  ENTITIES = [
    ['02 Civic & Community/Seattle CTAB', /\bctab\b|community technology advisory board/i],
    ['02 Civic & Community/CDCPDA', /\bcdcpda\b|\bcd connected\b/i],
    ['02 Civic & Community/iUrban Teen', /iurban[\s_-]*teen|\biurban\b/i],
    ['02 Civic & Community/NAACP and Read Rise Thrive', /\bnaacp\b|read[,\s&]+rise|branch[\s_-]*1136/i],
    ['02 Civic & Community/AMPLIFY', /\bamplify\b/i],
    ['02 Civic & Community/MLK Coalition and Opportunity Fair', /\bmlk\b|\bsmlkoc\b|martin luther king|mlkcc/i],
    ['02 Civic & Community/Black Diasporic Community Survey', /black diasporic|black diaspora/i],
    ['02 Civic & Community/Community One and Tepe Park', /community[\s_-]*one|\btepe park\b/i],
    ['03 FIFA World Cup & Sports', /\bfifa\b|world[\s_-]*cup|\bwc2026\b|sportonomics|seattle sports commission/i],
    ['01 The Data Guys/Projects and Partners/Construction Client', /\bconstruction[\s_-]*client\b|enterprise[\s_-]*wip/i],
    ['01 The Data Guys/Projects and Partners/Client B', /\bclient[\s_-]*b\b|rfq[\s_-]*matcher/i],
    ['01 The Data Guys/Projects and Partners/Client C', /\bclient[\s_-]*c\b/i],
    ['01 The Data Guys/Projects and Partners/Client D', /\bClient D\b/i],
    ['01 The Data Guys/Projects and Partners/Client E', /\bClient E\b/i],
    ['01 The Data Guys/Projects and Partners/Client F', /\bClient F\b/i],
    ['01 The Data Guys/Projects and Partners/Client G', /\bClient G\b/i],
    ['01 The Data Guys/Projects and Partners/Client H', /\bClient H\b|material recovery/i],
    ['01 The Data Guys/Workspace Unlocked', /workspace[\s_-]*unlocked/i]
  ].freeze

  def self.fingerprint(path)
    st = File.lstat(path)
    {'dev'=>st.dev, 'ino'=>st.ino, 'size'=>st.size, 'mtime'=>st.mtime.to_f}
  end

  def self.same?(path, fp)
    return false if File.symlink?(path) || !File.file?(path)
    fingerprint(path) == fp
  rescue SystemCallError
    false
  end

  def self.within?(path, root)
    path == root || path.start_with?(root + File::SEPARATOR)
  end

  # Checks every existing path component; never follows a link into another location.
  def self.safe_ancestors!(path)
    p = File.expand_path(path)
    loop do
      raise "Symlink in path: #{p}" if File.symlink?(p)
      break if p == File.dirname(p)
      p = File.dirname(p)
    end
    true
  end

  def self.atomic_move(source, target)
    safe_ancestors!(source)
    safe_ancestors!(target)
    raise "Destination already exists: #{target}" if File.exist?(target) || File.symlink?(target)
    raise 'Cross-volume move blocked; no copy/delete fallback is permitted.' unless File.stat(source).dev == File.stat(File.dirname(target)).dev
    if RUBY_PLATFORM.include?('darwin')
      fn = Fiddle::Function.new(Fiddle::Handle::DEFAULT['renamex_np'],
        [Fiddle::TYPE_VOIDP,Fiddle::TYPE_VOIDP,Fiddle::TYPE_INT],Fiddle::TYPE_INT)
      # Darwin RENAME_EXCL: atomically fail if the destination exists.
      rc = fn.call(source + "\0", target + "\0", 4)
    elsif RUBY_PLATFORM.include?('linux')
      # Test platform only. Identical non-replacing rename semantics.
      fn = Fiddle::Function.new(Fiddle::Handle::DEFAULT['renameat2'],
        [Fiddle::TYPE_INT,Fiddle::TYPE_VOIDP,Fiddle::TYPE_INT,Fiddle::TYPE_VOIDP,Fiddle::TYPE_INT],Fiddle::TYPE_INT)
      rc = fn.call(-100, source + "\0", -100, target + "\0", 1)
    else
      raise 'Unsupported platform'
    end
    raise SystemCallError.new("Exclusive rename failed",Fiddle.last_error) unless rc == 0
  end

  def self.year(name, mtime)
    hit = name.match(/(?:^|\D)(20[0-3]\d)(?:\D|$)/)
    hit ? hit[1] : Time.at(mtime).year.to_s
  end

  # Result is a proposed category, not a claim that file contents were reviewed.
  def self.classify(name, mtime)
    n = name.tr('_',' ')
    ext = File.extname(name).downcase
    if name.start_with?('~$') || name =~ /\.(?:part|crdownload|download|tmp)\z/i
      return ['99 To Review for Deletion','review','Temporary or Office lock file; leave in place until app state is checked.']
    end
    if n =~ /password|backup[\s-]*code|recovery[\s-]*code|\bcredentials\b|private[\s-]*key|\bsecret\b/i
      return ['05 Personal/Security-related Records','review','Sensitive filename; do not open or relocate automatically. A folder is not a security control.']
    end
    if ext == '.ics'
      return ['99 To Review for Deletion','review','Calendar attachment; event status not verified. Retain in place.']
    end
    if %w[.dmg .pkg .exe .msi].include?(ext)
      return ['99 To Review for Deletion/Installers','high','Standalone installer; stage for review, never delete.']
    end
    if MEDIA_EXT.include?(ext) && n =~ /^screen recording/i
      return ["06 Media/Screen Recordings/#{year(n,mtime)}",'high','Screen recording retained; year from filename, otherwise modification date.']
    end
    if MEDIA_EXT.include?(ext) && n =~ /^(?:screen\s?shot|screenshot)/i
      return ["06 Media/Screenshots/#{year(n,mtime)}",'high','Screenshot; year from filename, otherwise modification date.']
    end
    if SAFE_DOC_EXT.include?(ext) && n =~ /\bresume\b|résumé|cover[\s-]*letter/i && n =~ /scisney|deimarlon|dei.?marlon/i
      return ['04 Career & Professional/Resumes and Cover Letters','high','Personal résumé or cover letter explicitly identified in filename.']
    end
    matches = ENTITIES.select { |_,rx| n =~ rx }
    if matches.length > 1
      return ['98 Needs Identification','review',"Multiple projects mentioned: #{matches.map(&:first).join('; ')}"]
    end
    if matches.length == 1
      return [matches[0][0],'high','Explicit organization/project name in filename; content not inspected.']
    end
    if n =~ /the[\s_-]*data[\s_-]*guys/i
      function =
        if n =~ /logo|brand|business card|banner|flyer/i then 'Brand and Communications'
        elsif n =~ /invoice|expense|mileage|profit|budget|tax/i then 'Finance'
        elsif n =~ /agreement|contract|\bnda\b|w-?9|llc|filing/i then 'Company Administration'
        elsif n =~ /proposal|rfp|rfq|capability/i then 'Business Development'
        elsif %w[.ppt .pptx].include?(ext) then 'Presentations'
        else 'Company Documents'
        end
      return ["01 The Data Guys/#{function}",'high','The Data Guys is explicitly named; function inferred from filename.']
    end
    if n =~ /^dall[·. -]*e|^chatgpt image/i && MEDIA_EXT.include?(ext)
      return ['06 Media/AI-generated Images','high','Explicit AI-image filename.']
    end
    if MEDIA_EXT.include?(ext) && name =~ /^(IMG|DSC|PXL)[_-]/i
      return ["06 Media/Camera Originals/#{year(n,mtime)}",'high','Camera filename; keep original name. Year may reflect modification rather than capture.']
    end
    if LINKED_EXT.include?(ext)
      return ['08 Data, Design & Development','review','Potential linked data, code or design asset; preserve its current path.']
    end
    if n =~ /\b(?:rfp|rfq|itb)\b|solicitation|pre-proposal/i
      return ['09 Reference & Opportunities/Procurement','review','Procurement material; owning project not yet verified.']
    end
    if %w[.zip .rar .gz .7z .tar .tgz].include?(ext)
      return ['07 Archives','review','Archive retained intact; contents and project affiliation not inspected.']
    end
    if n =~ /invoice|tax|budget|contract|agreement|statement/i
      return ['98 Needs Identification','review','Financial or legal material; do not assume business, civic or personal ownership.']
    end
    ['98 Needs Identification','review','Insufficient evidence from filename; retain in place and index for review.']
  end

  class Organizer
    attr_reader :home, :cloud, :tool_dir, :roots, :loose_dirs
    def initialize(home = Dir.home, tool_dir = File.dirname(File.realpath(__FILE__)))
      @home = File.expand_path(home)
      @cloud = File.join(@home,'Library/Mobile Documents/com~apple~CloudDocs')
      @tool_dir = File.expand_path(tool_dir)
      @roots = [@cloud] + %w[Downloads Desktop Documents Pictures Movies Music Public].map { |n| File.join(@home,n) }
      @loose_dirs = [@home,@cloud] + %w[Downloads Desktop Documents].map { |n| File.join(@home,n) }
      [
        "Desktop - Dei'Marlon’s iMac",
        "Desktop - Dei'Marlon’s iMac/Desktop Folder",
        "DeiMarlons Macbook Desktop",
        "DeiMarlons Macbook Desktop/Folder",
        "Documents - mac’s MacBook Pro",
        "Documents - Dei'Marlon’s iMac",
        'Downloads'
      ].each { |p| @loose_dirs << File.join(@cloud,p) }
      @roots.each { |r| Filing.safe_ancestors!(r) }
    end

    def snapshot
      entries, exclusions, errors = [], [], []
      seen = Set.new
      walker = lambda do |path, descend|
        return if seen.include?(path)
        seen << path
        name = File.basename(path)
        if name.start_with?('.') || IGNORE.include?(name)
          exclusions << {'path'=>path,'reason'=>'Hidden/system metadata excluded'}
          return
        end
        if Filing.within?(path,@tool_dir) || path == File.join(@cloud,'00 Start Here - File Guide')
          exclusions << {'path'=>path,'reason'=>'Organization tools/reports; not user-file candidates'}
          return
        end
        begin
          st = File.lstat(path)
          if st.symlink?
            entries << {'path'=>path,'kind'=>'symlink','size'=>st.size,'reason'=>'Link preserved; target not traversed'}
          elsif st.directory?
            package = PACKAGE_EXT.include?(File.extname(name).downcase) || name =~ /Photo Booth Library|My Tableau Repository/i
            entries << {'path'=>path,'kind'=>(package ? 'package' : 'directory'),'size'=>nil,
              'reason'=>(package ? 'Application library/package retained intact; contents excluded' : 'Existing folder structure retained')}
            if package
              exclusions << {'path'=>path,'reason'=>'Package internals not traversed'}
            elsif descend
              # Inventory project members but never propose moving them.
              Dir.children(path).sort.each { |n| walker.call(File.join(path,n),true) }
            end
          elsif st.file?
            fp = Filing.fingerprint(path)
            entries << {'path'=>path,'kind'=>'file','size'=>st.size,'fingerprint'=>fp}
          else
            exclusions << {'path'=>path,'reason'=>'Special filesystem object excluded'}
          end
        rescue SystemCallError, ArgumentError => e
          errors << {'path'=>path,'error'=>e.message}
        end
      end
      @roots.each do |r|
        next unless File.exist?(r)
        begin
          Dir.children(r).sort.each { |n| walker.call(File.join(r,n),true) }
        rescue SystemCallError => e
          errors << {'path'=>r,'error'=>e.message}
        end
      end
      # Top-level home documents only; never enter Library, Applications or hidden folders.
      Dir.children(@home).sort.each do |n|
        p = File.join(@home,n)
        walker.call(p,false) if File.file?(p) && !n.start_with?('.')
      end
      {'entries'=>entries,'exclusions'=>exclusions,'errors'=>errors}
    end

    def reserve_destination(category, name, used)
      dir = File.join(@cloud,category)
      target = File.join(dir,name)
      stem, ext = File.basename(name,File.extname(name)), File.extname(name)
      count = 2
      while used.include?(target.downcase) || File.exist?(target) || File.symlink?(target)
        target = File.join(dir,"#{stem} [retained copy #{count}]#{ext}")
        count += 1
      end
      used << target.downcase
      target
    end

    def build_plan(snap)
      used = Set.new
      snap['entries'].map.with_index do |entry,i|
        row = entry.merge('id'=>i+1,'action'=>'KEEP','destination'=>nil)
        unless entry['kind'] == 'file'
          row['category'] = 'Existing structures and libraries'
          row['confidence'] = 'preserve'
          next row
        end
        path, fp = entry.values_at('path','fingerprint')
        category, confidence, reason = Filing.classify(File.basename(path),fp['mtime'])
        row.merge!('category'=>category,'confidence'=>confidence,'reason'=>reason)
        # Already-organized paths are retained. Their actual location is indexed.
        if !@loose_dirs.include?(File.dirname(path))
          root = @roots.select { |r| Filing.within?(path,r) }.max_by(&:length)
          relative = root ? path[(root.length+1)..-1] : path
          existing_group = relative.split(File::SEPARATOR).first
          row['category'] = "Existing group: #{existing_group}" if confidence=='review'
          row['confidence'] = 'preserve'
          row['reason'] = "Keep existing structure. Filename topic suggestion: #{category}. #{reason}"
          next row
        end
        if LINKED_EXT.include?(File.extname(path).downcase)
          row['reason'] = "Dependency check required; retained in place. #{reason}"
          row['confidence'] = 'review'
          next row
        end
        if Time.now.to_f - fp['mtime'] < 86_400
          row['reason'] = "Modified within 24 hours; retained for current work. #{reason}"
          next row
        end
        siblings = [File.join(File.dirname(path),File.basename(path,File.extname(path))+'_files')]
        if siblings.any? { |p| File.directory?(p) }
          row['reason'] = 'Companion resource folder present; retain together.'
          next row
        end
        ext = File.extname(path).downcase
        movable = SAFE_DOC_EXT.include?(ext) || MEDIA_EXT.include?(ext) || %w[.dmg .pkg .exe .msi].include?(ext)
        if confidence == 'high' && movable
          row['destination'] = reserve_destination(category,File.basename(path),used)
          row['action'] = 'MOVE'
        end
        row
      end
    end

    def create_run
      Filing.safe_ancestors!(@tool_dir)
      FileUtils.mkdir_p(File.join(@tool_dir,'Runs'))
      run = File.join(@tool_dir,'Runs',Time.now.strftime('%Y%m%d-%H%M%S')+'-'+SecureRandom.hex(3))
      Dir.mkdir(run,0700)
      run
    end

    def write_json(path,obj)
      File.open(path,File::WRONLY|File::CREAT|File::EXCL,0600) { |f| f.write(JSON.pretty_generate(obj)); f.flush; f.fsync }
    end

    def csv_cell(value)
      value = value.to_s
      # Prevent spreadsheet formula execution when a filename begins with = + - @.
      value =~ /\A[=+\-@\t\r]/ ? "'" + value : value
    end

    def write_csv(path,headers,rows)
      CSV.open(path,'wb',:write_headers=>true,:headers=>headers) do |csv|
        rows.each { |r| csv << r.map { |v| csv_cell(v) } }
      end
      File.chmod(0600,path)
    end

    def preview
      run = create_run
      snap = snapshot
      plan = build_plan(snap)
      write_json(File.join(run,'plan.json'),{'version'=>VERSION,'home'=>@home,'cloud'=>@cloud,'created'=>Time.now.iso8601,'rows'=>plan})
      write_json(File.join(run,'scan-scope.json'),{'roots'=>@roots,'home_top_level_only'=>true,'exclusions'=>snap['exclusions'],'errors'=>snap['errors']})
      write_csv(File.join(run,'Preview.csv'),%w[ID Action Name Current_location Proposed_location Category Confidence Reason],
        plan.map { |r| [r['id'],r['action'],File.basename(r['path']),r['path'],r['destination'],r['category'],r['confidence'],r['reason']] })
      write_csv(File.join(run,'Needs-review.csv'),%w[Name Current_location Suggested_category Reason],
        plan.select { |r| r['kind']=='file' && r['action']=='KEEP' && r['confidence']=='review' }.map { |r| [File.basename(r['path']),r['path'],r['category'],r['reason']] })
      # Filename/size candidates only, never used to stage or delete duplicates.
      groups = plan.select { |r| r['kind']=='file' && @loose_dirs.include?(File.dirname(r['path'])) && r['size']>0 }.group_by do |r|
        n = File.basename(r['path'])
        ext = File.extname(n)
        stem = File.basename(n,ext).sub(/(?:\s*\(\d+\))+\z/,'')
        [stem.downcase,ext.downcase,r['size']]
      end
      candidates = groups.values.select { |a| a.size>1 }.flat_map.with_index do |a,i|
        a.map { |r| [i+1,r['path'],r['size'],'UNVERIFIED: name and size only. All copies retained.'] }
      end
      write_csv(File.join(run,'Possible-duplicates-NOT-confirmed.csv'),%w[Group Location Logical_bytes Status],candidates)
      moves = plan.select { |r| r['action']=='MOVE' }
      report = "# Organization Preview\n\nNo user files have been moved by this preview.\n\n"
      report << "- Indexed entries: #{plan.length} (files, folders, packages and links).\n"
      report << "- Proposed individual-file moves: #{moves.length}.\n"
      report << "- Entries retained at their current locations: #{plan.length-moves.length}.\n"
      report << "- Scan errors: #{snap['errors'].length}; see scan-scope.json. No complete-scope claim is made when errors exist.\n"
      report << "- Logical bytes proposed for relocation: #{moves.sum { |r| r['size'] }}. This is NOT space recovered.\n\n"
      report << "## Proposed destinations\n\n"
      moves.group_by { |r| r['category'] }.sort.each { |c,a| report << "- #{c}: #{a.length} files\n" }
      report << "\n## Review before approval\n\n"
      report << "Open Preview.csv for every proposed move and reason. Needs-review.csv lists uncertain loose files and dependency-sensitive files; they are not moved. Existing folders stay intact, while their members remain searchable in the index. Possible duplicate matches do not cause moves or deletions. Filename-based classification is not a content review.\n\n"
      report << "All recordings are retained. New/recent files, linked spreadsheets/data/design assets, code, credentials, open files, packages and libraries are preserved. There are no delete commands, cloud-download removal commands or recursive folder moves. No file bytes are read by the inventory. Do not assume iCloud sync is complete or Mac disk space was freed.\n"
      File.write(File.join(run,'READ FIRST.md'),report)
      [run,plan]
    end

    def append_event(run,event)
      File.open(File.join(run,'journal.jsonl'),File::WRONLY|File::CREAT|File::APPEND,0600) do |f|
        f.write(JSON.generate(event.merge('at'=>Time.now.iso8601))+"\n"); f.flush; f.fsync
      end
    end

    def read_journal(run)
      p = File.join(run,'journal.jsonl')
      return [] unless File.exist?(p)
      out = []
      File.foreach(p) do |line|
        begin
          out << JSON.parse(line)
        rescue JSON::ParserError
          # Crash-torn trailing record: prior intent records still support recovery.
        end
      end
      out
    end

    def open_files
      return Set.new if ENV['FILING_TEST_MODE']=='1' && !RUBY_PLATFORM.include?('darwin')
      names = Set.new
      IO.popen(['/usr/sbin/lsof','-nP','-F','n','-u',Process.uid.to_s],:err=>File::NULL) do |io|
        io.each_line { |line| names << line[1..-1].strip if line.start_with?('n/') }
      end
      raise 'Cannot inspect open files safely; no moves will start.' unless $?.success?
      names
    end

    def validate_plan!(payload)
      raise 'Plan is for another home or iCloud location' unless payload['home']==@home && payload['cloud']==@cloud
      payload['rows'].each do |r|
        next unless r['action']=='MOVE'
        s,d = r.values_at('path','destination')
        raise 'Invalid source path' unless @loose_dirs.include?(File.dirname(s)) && File.expand_path(s)==s
        raise 'Destination outside iCloud' unless d && Filing.within?(d,@cloud) && File.expand_path(d)==d && d!=@cloud
        raise 'Invalid destination category' unless r['category'] && File.dirname(d)==File.join(@cloud,r['category'])
        raise 'Destination is in organizer tools' if Filing.within?(d,@tool_dir)
        Filing.safe_ancestors!(s)
        Filing.safe_ancestors!(d)
      end
      true
    end

    def check_writable!(paths)
      paths.uniq.each do |dir|
        ancestor = dir
        ancestor = File.dirname(ancestor) until File.directory?(ancestor)
        Filing.safe_ancestors!(ancestor)
        test = File.join(ancestor,'.filing-access-'+SecureRandom.hex(8))
        Dir.mkdir(test,0700)
        Dir.rmdir(test) # only the temporary empty directory just created
      end
    end

    def apply(run, payload, limit=nil)
      validate_plan!(payload)
      moves = payload['rows'].select { |r| r['action']=='MOVE' }
      moves = moves.first(limit) if limit
      events = read_journal(run)
      attempted = events.select { |e| e['event']=='intent' }.map { |e| e['id'] }.to_set
      # For interrupted runs, never repeat an intent; verify/undo determines state.
      moves = moves.reject { |r| attempted.include?(r['id']) }
      check_writable!(moves.flat_map { |r| [File.dirname(r['path']),File.dirname(r['destination'])] })
      opens = open_files
      moved = 0
      moves.each_with_index do |r,i|
        opens = open_files if i>0 && i%50==0
        s,d = r.values_at('path','destination')
        reason = if !Filing.same?(s,r['fingerprint'])
          'Source changed, disappeared or is a link since preview'
        elsif opens.include?(s)
          'File currently open in an application'
        elsif File.exist?(d) || File.symlink?(d)
          'Destination appeared after preview; never overwrite'
        end
        if reason
          append_event(run,{'event'=>'skipped','id'=>r['id'],'reason'=>reason,'source'=>s})
          next
        end
        begin
          Filing.safe_ancestors!(d)
          FileUtils.mkdir_p(File.dirname(d))
          Filing.safe_ancestors!(d)
          raise 'Source changed during preflight' unless Filing.same?(s,r['fingerprint'])
          append_event(run,{'event'=>'intent','id'=>r['id'],'source'=>s,'destination'=>d,'fingerprint'=>r['fingerprint']})
          Filing.atomic_move(s,d)
          raise 'Post-move identity verification failed; stop and inspect journal' unless !File.exist?(s) && Filing.same?(d,r['fingerprint'])
          append_event(run,{'event'=>'moved_verified','id'=>r['id'],'source'=>s,'destination'=>d})
          moved += 1
        rescue StandardError => e
          append_event(run,{'event'=>'error','id'=>r['id'],'reason'=>e.message})
          # Stop on unexpected errors instead of compounding a permissions/sync problem.
          warn "Stopped at #{s}: #{e.message}"
          break
        end
        puts "Verified #{moved} moves..." if moved%100==0
      end
      verify(run,payload)
      moved
    end

    def verify(run,payload)
      latest_undo = read_journal(run).select { |e| e['event']=='undo_verified' }.map { |e| e['id'] }.to_set
      results = payload['rows'].map do |r|
        s,d = r.values_at('path','destination')
        if r['kind']!='file'
          status = File.exist?(s) || File.symlink?(s) ? 'RETAINED' : 'MISSING'
          actual = s
        elsif Filing.same?(s,r['fingerprint'])
          status = latest_undo.include?(r['id']) ? 'RESTORED_VERIFIED' : 'RETAINED_VERIFIED'
          actual = s
        elsif d && Filing.same?(d,r['fingerprint']) && !File.exist?(s)
          status,actual = 'MOVED_VERIFIED',d
        elsif File.exist?(s)
          status,actual = 'CHANGED_SINCE_PREVIEW',s
        elsif d && File.exist?(d)
          status,actual = 'DESTINATION_CHANGED_REVIEW',d
        else
          status,actual = 'MISSING_REVIEW',s
        end
        r.merge('verification'=>status,'actual'=>actual)
      end
      write_csv(File.join(run,'Where-Everything-Is.csv'),
        %w[Name Actual_location Category Verification Action_proposed Original_location Logical_bytes Reason],
        results.map { |r| [File.basename(r['actual']),r['actual'],r['category'],r['verification'],r['action'],r['path'],r['size'],r['reason']] })
      counts = results.group_by { |r| r['verification'] }.transform_values(&:length)
      File.write(File.join(run,'Verification.md'),"# Verification\n\nChecked #{Time.now.iso8601}.\n\n"+
        counts.map { |k,v| "- #{k}: #{v}" }.join("\n")+
        "\n\nVerification compares filesystem identity, logical size and modification time, not file hashes or cloud upload state. No content downloads or deletions were performed. This index covers the preview snapshot; newer files require another scan. Scan exclusions and errors are in scan-scope.json.\n")
      puts "Verification: #{counts}"
      results
    end

    def undo(run,payload)
      validate_plan!(payload)
      intents = read_journal(run).select { |e| e['event']=='intent' }
      approved = payload['rows'].select { |r| r['action']=='MOVE' }.map { |r| [r['id'],r] }.to_h
      intents.each do |e|
        r = approved[e['id']]
        raise 'Journal does not match the approved plan; undo stopped' unless r &&
          e['source']==r['path'] && e['destination']==r['destination'] && e['fingerprint']==r['fingerprint']
      end
      opens = open_files
      intents.reverse.each_with_index do |e,i|
        opens = open_files if i>0 && i%50==0
        s,d,fp = e.values_at('source','destination','fingerprint')
        next if Filing.same?(s,fp)
        unless !File.exist?(s) && !File.symlink?(s) && Filing.same?(d,fp) && !opens.include?(d)
          append_event(run,{'event'=>'undo_skipped','id'=>e['id'],'reason'=>'Original path occupied, destination changed/missing, or file open'})
          next
        end
        begin
          Filing.safe_ancestors!(s)
          FileUtils.mkdir_p(File.dirname(s))
          append_event(run,{'event'=>'undo_intent','id'=>e['id'],'source'=>d,'destination'=>s})
          Filing.atomic_move(d,s)
          raise 'Restore identity verification failed' unless Filing.same?(s,fp) && !File.exist?(d)
          append_event(run,{'event'=>'undo_verified','id'=>e['id']})
        rescue StandardError => err
          append_event(run,{'event'=>'undo_error','id'=>e['id'],'reason'=>err.message})
          break
        end
      end
      verify(run,payload)
      # Empty destination folders deliberately retained; never recursive cleanup.
    end
  end

  def self.main
    raise 'This organizer is intended for macOS.' unless RUBY_PLATFORM.include?('darwin')
    org = Organizer.new
    FileUtils.mkdir_p(org.tool_dir)
    File.open(File.join(org.tool_dir,'.organizer.lock'),File::RDWR|File::CREAT,0600) do |lock|
      raise 'Another organizer is running. Close it first.' unless lock.flock(File::LOCK_EX|File::LOCK_NB)
      puts "\nSAFE FILE ORGANIZER #{VERSION}\nNo permanent deletion. No duplicate removal. No cloud-file downloads.\n"
      puts 'Close documents you are editing. Keep a separate backup of important work.'
      puts "\n1  Preview and organize\n2  Verify an earlier run\n3  Undo an earlier run\n4  Find a file in the latest index\nAnything else exits."
      choice = STDIN.gets.to_s.strip
      if choice == '1'
        puts 'Scanning filenames and filesystem metadata only...'
        run,plan = org.preview
        org.verify(run,JSON.parse(File.read(File.join(run,'plan.json'))))
        puts File.read(File.join(run,'READ FIRST.md'))
        puts "\nPreview and full index saved here:\n#{run}\n"
        system('/usr/bin/open','-R',File.join(run,'Preview.csv'))
        puts "\nReview Preview.csv in Finder. You may remove moves before approving:"
        puts 'Enter file IDs or ID ranges to KEEP in place (example 12,18-25), or press Return to keep the proposed selection.'
        excluded = STDIN.gets.to_s.strip
        ids = Set.new
        excluded.split(',').each do |token|
          token = token.strip
          next if token.empty?
          raise 'Invalid ID or range. Nothing has moved.' unless token =~ /\A\d+(?:-\d+)?\z/
          a,b = token.split('-').map(&:to_i)
          b ||= a
          raise 'Invalid or excessive range' if b<a || b-a>plan.length
          (a..b).each { |id| ids << id }
        end
        payload = JSON.parse(File.read(File.join(run,'plan.json')))
        payload['rows'].each do |r|
          next unless ids.include?(r['id'])
          r['action']='KEEP'; r['destination']=nil; r['reason']='User selected KEEP at approval'
        end
        org.write_json(File.join(run,'approved-plan.json'),payload)
        count = payload['rows'].count { |r| r['action']=='MOVE' }
        puts "\n#{count} moves selected. Type ORGANIZE to apply them, or anything else to exit without moving files."
        if STDIN.gets.to_s.strip == 'ORGANIZE'
          org.apply(run,payload)
          system('/usr/bin/open','-R',File.join(run,'Where-Everything-Is.csv'))
        else
          puts 'Preview saved. No user files moved.'
        end
      elsif %w[2 3 4].include?(choice)
        runs = Dir.glob(File.join(org.tool_dir,'Runs','*')).select { |p| File.file?(File.join(p,'plan.json')) }.sort.reverse
        raise 'No preview runs found yet.' if runs.empty?
        if choice=='4'
          idx = File.join(runs.first,'Where-Everything-Is.csv')
          print 'Search filename, category or location: '
          query = STDIN.gets.to_s.strip.downcase
          raise 'Enter a nonempty search' if query.empty?
          matches = CSV.read(idx,:headers=>true).select { |r| r.fields.join(' ').downcase.include?(query) }
          matches.first(100).each { |r| puts "#{r['Name']}\n  #{r['Actual_location']}\n  #{r['Verification']}\n\n" }
          puts "#{matches.length} matches. Showing first 100. Index is a snapshot of its last verification."
          return
        end
        runs.each_with_index { |r,i| puts "#{i+1}  #{File.basename(r)}" }
        print 'Choose run number: '
        n = Integer(STDIN.gets.to_s.strip)
        raise 'Invalid run number' unless n>=1 && n<=runs.length
        run = runs[n-1]
        approved = File.join(run,'approved-plan.json')
        payload = JSON.parse(File.read(File.exist?(approved) ? approved : File.join(run,'plan.json')))
        if choice=='2'
          org.verify(run,payload)
        else
          puts 'Type UNDO to restore unchanged moved files. Occupied original paths and changed files will be skipped.'
          org.undo(run,payload) if STDIN.gets.to_s.strip=='UNDO'
        end
        puts "Reports: #{run}"
      else
        puts 'Exited without moving files.'
      end
    end
  rescue Interrupt
    warn "\nInterrupted. Completed moves are journaled. Relaunch and choose Verify or Undo."
  rescue StandardError => e
    warn "\nSTOPPED: #{e.message}\nNo further moves will occur. Keep the Runs folder and journal for recovery."
    exit 1
  end
end

Filing.main if __FILE__ == $PROGRAM_NAME
