#!/usr/bin/env ruby
# Comprehensive second pass. No deletion, duplicate removal, content downloads,
# symlink relocation, application-library relocation, or dependency rewriting.
require_relative 'safety_core'
require 'open3'
require 'find'

module CompleteFiling
  DEPENDENCIES = (Filing::LINKED_EXT + %w[.pkl .xml .php .ino .enw .bib .vcf .vtt .jsonl .yml .yaml .ini .cfg .log .ttf .otf .eps .svg .fig]).uniq
  PROTECTED_CLOUD = ['Desktop','Documents','Adobe','My Tableau Repository','Zoom']
  SOURCE_LABELS = {
    'Downloads'=>'Mac Downloads', 'Desktop'=>'Mac Desktop', 'Documents'=>'Mac Documents',
    'Pictures'=>'Mac Pictures', 'Movies'=>'Mac Movies', 'Music'=>'Mac Music', 'Public'=>'Mac Public'
  }
  TOPICS = [
    ['02 Civic & Community/MLK Coalition and Opportunity Fair', /\bmlk\b|mlkcc|smlkoc|martin luther king/i],
    ['02 Civic & Community/Digital Equity and Broadband', /digital[\s_-]*equity|digequity|broadband|digital navigator/i],
    ['01 The Data Guys/Projects and Partners/Cannabis-related Work', /cannabis|cannabis alliance|greenleaf industries/i],
    ['01 The Data Guys/Projects and Partners/PGST', /\bpgst\b|port gamble s.?klallam/i],
    ['01 The Data Guys/Projects and Partners/Denkyem', /\bdenkyem\b/i],
    ['01 The Data Guys/Projects and Partners/uCollabit', /ucollabit/i],
    ['01 The Data Guys/Projects and Partners/Puyallup', /puyallup/i],
    ['01 The Data Guys/Projects and Partners/Workforce Development', /\bwdc\b|\bwioa\b|workforce development council/i],
    ['01 The Data Guys/Projects and Partners/Seattle Colleges', /seattle colleges/i],
    ['05 Personal/Property/807 Washington', /807[\s_#-]*(washington|wa\b|#?2\b)/i],
    ['05 Personal/Property/208 Oak Street', /208[\s_-]*oak/i],
    ['05 Personal/Property/Kentucky', /\bproperty.*\bky\b/i],
    ['05 Personal/Housing and Lease Records', /\b220\b.*(?:renewal|lease|resledger)|bluemoon lease|rent.*ledger|renter.*insurance/i],
    ['05 Personal/Vehicle Records', /vehicle sales|vehicle registration|auto insurance|car insurance/i],
    ['04 Career & Professional/Applications and Role Information', /resume|résumé|cover[\s_-]*letter|job description|job posting|renewal offer letter.*employment|associate director|sales associate|interview questions|teaching professor/i],
    ['07 Working Materials/Procurement and Proposals', /rfp|rfq|\brfi\b|solicitation|\bproposal\b|\bitb\b|procurement|competitive sealed bid|bidder|\bexhibit\b|addendum|\bnofo\b|sole source/i],
    ['07 Working Materials/Grants and Funding', /\bgrant\b|\bfunding\b|application guide/i],
    ['07 Working Materials/Contracts and Legal', /contract|agreement|non[\s-]*disclosure|\bnda\b|docusign|signed document|bylaws|by laws|compliance|representations.*certification|\bw.?9\b|\bllc\b|\bein\b/i],
    ['07 Working Materials/Finance and Administration', /invoice|receipt|budget|financial|profit.?and.?loss|balance sheet|payroll|mileage|expense|statement|checking|cashflow|cash flow|1099|form1065|schedulec|depreciation|tax\b/i],
    ['07 Working Materials/Meetings and Correspondence', /agenda|minutes|meeting|letter|correspondence|debrief|notes\b/i],
    ['07 Working Materials/Governance and Policies', /nomination|board protocol|governance|policy|policies|resolution|charter|committee/i],
    ['07 Working Materials/Branding and Design', /logo|brand|business.?card|banner|flyer|poster|brochure|mockup|socialbanner|qr.?code/i],
    ['07 Working Materials/Presentations and Training', /presentation|pitch|keynote|workshop|webinar|curricul|syllabus|course|training|workbook|deck\b/i],
    ['09 Reference & Research/AI and Technology', /\bai\b|artificial intelligence|chatgpt|machine learning|cybersecurity|quantum|python|cloud computing|data architecture|automation/i],
    ['09 Reference & Research/Economic and Community Research', /economic|demographic|census|equity|disparit|community research|workforce|housing|urban|zoning|impact study|population/i],
    ['07 Working Materials/Reports and Planning', /report|assessment|analysis|framework|strategy|strategic|roadmap|plan\b|blueprint|architecture|guide|manual|checklist|sop\b/i]
  ].freeze
  FOLDER_MAP = {
    'Svg'=>'01 The Data Guys/Brand and Communications/Design Collections',
    'Jpg'=>'01 The Data Guys/Brand and Communications/Design Collections',
    'Pdf'=>'01 The Data Guys/Brand and Communications/Design Collections',
    '2659406_TheDataGuys_092225'=>'01 The Data Guys/Brand and Communications/Design Collections',
    '2688812_Data Is the New Oil_12192025_V1'=>'01 The Data Guys/Brand and Communications/Data Is the New Oil',
    '2688812_DataIstheNewOil_120925'=>'01 The Data Guys/Brand and Communications/Data Is the New Oil',
    'Data Is the New Oil - Deliverables'=>'01 The Data Guys/Brand and Communications/Data Is the New Oil',
    'Data Doesnt Lie - Deliverables'=>'01 The Data Guys/Brand and Communications/Data Doesnt Lie',
    'Nixie_One'=>'07 Working Materials/Branding and Design/Fonts',
    'ETH LOGO DRAFTS'=>'01 The Data Guys/Projects and Partners/Client D',
    'Scisney'=>'05 Personal/Legacy Collections',
    'HOP (Copy)'=>'01 The Data Guys/Projects and Partners/Client C',
    'Hello'=>'05 Personal/Legacy Collections',
    'Poems'=>'05 Personal/Writing',
    'Morgan-Freeman'=>'08 Data & Code/AI Voice Models',
    '807 Washington'=>'05 Personal/Property/807 Washington',
    'chuohoo-attachments'=>'06 Media/Image Collections',
    'drive-download-20260506T153051Z-3-001'=>'10 Filed Documents/Scanned Collections',
    'fwdgradypublicjobsinwashingtonstate'=>'07 Working Materials/Procurement and Proposals',
    'Preparation for Today\'s Meeting'=>'07 Working Materials/Meetings and Correspondence',
    'Technical Solutions tailored for Small Business Needs'=>'07 Working Materials/Branding and Design',
    'Ref1818-61'=>'07 Working Materials/Procurement and Proposals',
    'Screening or Skills Tests-selected'=>'04 Career & Professional/Applications and Role Information',
    'iMyFone VoxBox Installer.app'=>'99 To Review for Deletion/Installers'
  }.freeze

  def self.signature(path)
    s=File.lstat(path)
    if s.directory?
      {'kind'=>'directory','dev'=>s.dev,'ino'=>s.ino}
    else
      {'kind'=>s.symlink? ? 'symlink' : 'file','dev'=>s.dev,'ino'=>s.ino,'size'=>s.size,'mtime'=>s.mtime.to_f}
    end
  end

  def self.tree(path)
    out={}
    Find.find(path) do |p|
      # Finder metadata can change merely from browsing; it is retained, not compared.
      if ['.DS_Store','.localized'].include?(File.basename(p))
        Find.prune if File.directory?(p)
        next
      end
      rel=p==path ? '.' : p[(path.length+1)..-1]
      out[rel]=signature(p)
      Find.prune if File.symlink?(p)
    end
    out
  end

  def self.same_tree?(path, expected)
    (File.exist?(path)||File.symlink?(path)) && tree(path)==expected
  rescue SystemCallError
    false
  end

  def self.folder_key(name)
    n=name.strip
    3.times { n=n.sub(/\s*\(\d+\)\z/,'').sub(/\s+[2-9]\z/,'') }
    n.strip
  end

  class Runner
    attr_reader :core, :home, :cloud, :tool, :roots
    def initialize(home=Dir.home,tool=File.dirname(File.realpath(__FILE__)))
      @home=File.expand_path(home); @tool=File.expand_path(tool)
      @core=Filing::Organizer.new(@home,@tool)
      @cloud=@core.cloud
      @roots=[@cloud,*SOURCE_LABELS.keys.map{|n|File.join(@home,n)},@home]
      @metadata=File.exist?(File.join(@tool,'metadata.json')) ? JSON.parse(File.read(File.join(@tool,'metadata.json'))) : {}
    end

    def source_label(path)
      d=File.dirname(path)
      return 'iCloud Loose Workspace' if d==@cloud
      SOURCE_LABELS[File.basename(d)] || 'Home Loose Workspace'
    end

    def entity_category(name,mtime)
      c,confidence,_=Filing.classify(name,mtime)
      return c if confidence=='high' && c !~ /\A06 |\A99 / && c !~ /Security/
      n=name.tr('_',' ')
      return nil if Filing::ENTITIES.count{|_,rx|n =~ rx}>1
      match=TOPICS.find{|_,rx|n =~ rx}
      match && match.first
    end

    def folder_category(path)
      n=File.basename(path); key=CompleteFiling.folder_key(n)
      return FOLDER_MAP[key] if FOLDER_MAP[key]
      return '07 Archives/Imported Computer Folders' if n =~ /desktop|documents.*mac|deimarlons macbook|^Downloads$/i
      return '07 Archives/Saved Web Pages' if n =~ /_files\z|\.fld\z/i
      return '06 Media/Meeting Recordings' if n =~ /\A20\d\d-\d\d-\d\d.*\d\d[.]\d\d|zoom|recording/i
      return '08 Data & Code/Workspaces/iCloud Loose Workspace' if n =~ /pycharm|elevenfifty|python|Client G.*backend|procore|heavyjob|terminal.dungeon|athleda|locopy|developer|csharp|sql|implementation|sampledata|august.wips|^T&M$/i
      c=entity_category(n,Time.now.to_f)
      return c if c
      return '06 Media/Audio and Music Projects' if n =~ /draze|music|audio|voice/i
      '07 Archives/Preserved Collections'
    end

    def file_category(path,mtime)
      name=File.basename(path); n=name.tr('_',' '); ext=File.extname(path).downcase
      yr=Time.at(mtime).year.to_s
      return ['99 To Review for Deletion/Office Lock Files/'+source_label(path),'Office lock file; retained, not deleted.'] if name.start_with?('~$')
      if n =~ /password|backup[\s-]*code|recovery[\s-]*code|\bcredentials\b|private[\s-]*key|\bsecret\b/i
        return ['05 Personal/Security-related Records','Sensitive filename; contents not read. Folder placement does not add encryption.']
      end
      if %w[.crdownload .part .download .tmp].include?(ext)
        return ['99 To Review for Deletion/Incomplete Downloads','Incomplete or temporary download retained for review.']
      end
      # Dependency-capable loose assets stay together by their original source.
      if DEPENDENCIES.include?(ext)
        return ['08 Data & Code/Workspaces/'+source_label(path),'Preserve loose data/code/design assets together by source. Absolute links may need relinking; category is recorded in the index.']
      end
      if %w[.dmg .pkg .exe .msi].include?(ext)
        return ['99 To Review for Deletion/Installers','Installer staged, not deleted.']
      end
      if ext=='.ics'
        return ['07 Working Materials/Calendar Attachments/'+yr,'Calendar attachment preserved; not assumed expired.']
      end
      if %w[.html .htm].include?(ext)
        return ['07 Archives/Saved Web Pages','Saved web page retained with its resource folder.']
      end
      if Filing::MEDIA_EXT.include?(ext) && n =~ /^screen recording|^screen ?shot|^screenshot|^dall[·. -]*e|^chatgpt image/i
        c,_,r=Filing.classify(name,mtime)
        return [c,r]
      end
      if (c=entity_category(name,mtime))
        return [c,'Organization/project or document purpose indicated by filename; ownership not inferred from a generic file type.']
      end
      meta=@metadata[path] || {}
      title=meta['title'].to_s
      if !title.empty? && title !~ /chatgpt image|untitled|microsoft word|\A\d|\Apreview\z/i && (c=entity_category(title,mtime))
        return [c,'Embedded title provides a topic hint; original filename preserved.']
      end
      domains=Array(meta['domains']).join(' ')
      if domains =~ /bidprime|bid-prime|webs-vendor|hosting[.]portseattle/i
        return ['07 Working Materials/Procurement and Proposals','Download-domain metadata identifies procurement origin.']
      elsif domains =~ /filelocal-wa|ccfs[.]sos[.]wa[.]gov/i
        return ['07 Working Materials/Business Registration Records','Download-domain metadata identifies registration origin; ownership not assumed.']
      elsif domains =~ /courtrecords-api[.]seattle/i
        return ['05 Personal/Legal Records','Court-record download origin; contents not opened.']
      end
      case ext
      when '.png','.jpg','.jpeg','.heic','.dng','.gif','.webp','.tif','.tiff','.bmp','.ico'
        ['06 Media/Images and Graphics/'+yr,'Image with no verified project association; grouped by modification year.']
      when '.mov','.mp4','.m4v','.avi','.mkv','.webm'
        ['06 Media/Videos/'+yr,'Video preserved, grouped by modification year.']
      when '.mp3','.m4a','.wav','.aac','.flac'
        ['06 Media/Audio and Music/'+yr,'Audio preserved, grouped by modification year.']
      when '.zip','.rar','.gz','.tgz','.7z','.tar'
        ['07 Archives/Downloaded Archives/'+yr,'Archive retained unopened and unchanged.']
      when '.pptx','.ppt','.key'
        ['07 Working Materials/Presentations and Training/'+yr,'Presentation grouped by type; no organization assumed.']
      when '.eml','.msg'
        ['07 Working Materials/Email Exports/'+yr,'Email export preserved without reading message contents.']
      when '.pdf'
        ['10 Filed Documents/PDF Documents/'+yr,'Subject not verified; transparent document-type and modification-year filing.']
      when '.docx','.doc','.rtf','.odt','.pages'
        ['10 Filed Documents/Editable Documents/'+yr,'Subject not verified; transparent document-type and modification-year filing.']
      when '.txt','.md'
        ['10 Filed Documents/Notes and Text/'+yr,'Text document retained without opening its contents.']
      else
        ['10 Filed Documents/Other Files/'+yr,'Unrecognized format preserved and indexed, not discarded.']
      end
    end

    def candidates
      out=[]; exceptions=[]; seen_dirs=Set.new
      # Prefer home Desktop/Documents paths when iCloud exposes the same folders.
      order=@roots.reject{|r|r==@cloud} + [@cloud]
      order.each do |root|
        next unless File.directory?(root)
        id=[File.stat(root).dev,File.stat(root).ino]
        next if seen_dirs.include?(id)
        seen_dirs << id
        Dir.children(root).sort.each do |n|
          next if n.start_with?('.')
          p=File.join(root,n)
          next if p==@tool || Filing.within?(p,@tool)
          next if p==File.join(@cloud,'00 Start Here - File Guide')
          st=File.lstat(p)
          next if root==@home && st.directory?
          if st.symlink?
            exceptions << {'path'=>p,'reason'=>'Symlink retained at original path; target not traversed'}
            next
          end
          if st.directory?
            if root==@cloud && (n =~ /\A\d\d / || PROTECTED_CLOUD.include?(n))
              exceptions << {'path'=>p,'reason'=>(PROTECTED_CLOUD.include?(n) ? 'App-managed or macOS-linked location retained' : 'Existing numbered filing group retained; contents remain indexed')}
              next
            elsif root!=@cloud
              exceptions << {'path'=>p,'reason'=>'Existing user/app folder retained; contents remain indexed'}
              next
            elsif Filing::PACKAGE_EXT.include?(File.extname(n).downcase) && n!='iMyFone VoxBox Installer.app'
              exceptions << {'path'=>p,'reason'=>'Application package retained'}
              next
            end
          end
          category,reason=st.directory? ? [folder_category(p),'Move collection intact; internal names and relative structure preserved.'] : file_category(p,st.mtime.to_f)
          # Common exported designs have an associated folder; route both together.
          stem=File.basename(n,File.extname(n))
          if !st.directory? && [File.join(root,stem+'_files'),File.join(root,stem+'.fld')].any?{|x|File.directory?(x)}
            category='07 Archives/Saved Web Pages'
            reason='Document and companion resource directory share one destination parent.'
          end
          out << {'source'=>p,'kind'=>st.directory? ? 'directory' : 'file','category'=>category,'reason'=>reason,
            'topic'=>entity_category(n,st.mtime.to_f) || category,'office_lock'=>n.start_with?('~$'),
            'incomplete'=>n =~ /\.(?:crdownload|part|download|tmp)\z/i ? true : false}
        rescue SystemCallError => e
          exceptions << {'path'=>p,'reason'=>e.message}
        end
      end
      [out,exceptions]
    end

    def plan
      run=@core.create_run
      ops,exceptions=candidates
      reserved=Set.new
      ops.each_with_index do |o,i|
        o['id']=i+1
        n=File.basename(o['source']); dest=File.join(@cloud,o['category'],n)
        counter=2; ext=o['kind']=='file' ? File.extname(n) : ''; stem=ext.empty? ? n : File.basename(n,ext)
        while reserved.include?(dest.downcase)||File.exist?(dest)||File.symlink?(dest)
          dest=File.join(@cloud,o['category'],"#{stem} [retained copy #{counter}]#{ext}"); counter+=1
        end
        reserved << dest.downcase
        o['destination']=dest
        begin
          o['tree']=CompleteFiling.tree(o['source'])
        rescue SystemCallError=>e
          o['blocked']=e.message
        end
      end
      payload={'home'=>@home,'cloud'=>@cloud,'created'=>Time.now.iso8601,'operations'=>ops,'exceptions'=>exceptions}
      @core.write_json(File.join(run,'plan.json'),payload)
      @core.write_csv(File.join(run,'Preview.csv'),%w[ID Kind Name Original_location New_location Category Topic Reason Blocked],
        ops.map{|o|[o['id'],o['kind'],File.basename(o['source']),o['source'],o['destination'],o['category'],o['topic'],o['reason'],o['blocked']]})
      @core.write_csv(File.join(run,'Preserved-locations.csv'),%w[Location Reason],exceptions.map{|e|e.values_at('path','reason')})
      File.write(File.join(run,'Preview.md'),"# Comprehensive filing preview\n\n"+
        "#{ops.count{|o|o['kind']=='file'}} individual files and #{ops.count{|o|o['kind']=='directory'}} intact collections selected.\n\n"+
        "No files are deleted. Versions remain separate. Application locations are excluded. Incomplete/open/changing files are skipped. Data assets are kept together by original source; absolute references can still require relinking. Full original-to-new mapping is in Preview.csv.\n\n"+
        ops.group_by{|o|o['category']}.sort.map{|c,a|"- #{c}: #{a.length} top-level items"}.join("\n")+"\n")
      [run,payload]
    end

    def office_running?
      _,_,status=Open3.capture3('/usr/bin/pgrep','-f','/Microsoft (Word|Excel|PowerPoint)\\.app/')
      raise 'Cannot check Office application state' unless [0,1].include?(status.exitstatus)
      status.success?
    end

    def validate!(p)
      raise 'Wrong home/iCloud in plan' unless p['home']==@home && p['cloud']==@cloud
      p['operations'].each do |o|
        s,d=o.values_at('source','destination')
        raise 'Unexpected source scope' unless @roots.include?(File.dirname(s)) && File.expand_path(s)==s
        raise 'Protected folder selected' if o['kind']=='directory' && (File.dirname(s)!=@cloud || PROTECTED_CLOUD.include?(File.basename(s)) || File.basename(s)=~/\A\d\d /)
        raise 'Unsafe destination' unless Filing.within?(d,@cloud) && File.expand_path(d)==d && File.dirname(d)==File.join(@cloud,o['category'])
        raise 'Tools are not filing candidates' if Filing.within?(s,@tool)||Filing.within?(d,@tool)
        Filing.safe_ancestors!(s); Filing.safe_ancestors!(d)
      end
    end

    def apply(run,p)
      validate!(p)
      raise 'Close Microsoft Word, Excel and PowerPoint, then launch again. Nothing has moved in this run.' if p['operations'].any?{|o|o['office_lock']} && office_running?
      @core.check_writable!(p['operations'].flat_map{|o|[File.dirname(o['source']),File.dirname(o['destination'])]})
      attempted=@core.read_journal(run).select{|e|e['event']=='intent'}.map{|e|e['id']}.to_set
      open_paths=@core.open_files
      count=0
      p['operations'].each_with_index do |o,i|
        next if attempted.include?(o['id'])
        open_paths=@core.open_files if i>0&&i%100==0
        s,d=o.values_at('source','destination')
        problem=o['blocked']
        problem||='Incomplete download modified in the last 7 days; keep it in place' if o['incomplete']&&File.exist?(s)&&Time.now-File.mtime(s)<604800
        problem||='An application has this file or a member of this collection open' if open_paths.any?{|x|x==s||(o['kind']=='directory'&&Filing.within?(x,s))}
        problem||='File or collection changed since preview' unless o['tree']&&CompleteFiling.same_tree?(s,o['tree'])
        problem||='Destination exists; overwrite prohibited' if File.exist?(d)||File.symlink?(d)
        if problem
          @core.append_event(run,{'event'=>'skipped','id'=>o['id'],'source'=>s,'reason'=>problem})
          next
        end
        begin
          Filing.safe_ancestors!(d)
          FileUtils.mkdir_p(File.dirname(d))
          @core.append_event(run,{'event'=>'intent','id'=>o['id'],'source'=>s,'destination'=>d})
          Filing.atomic_move(s,d)
          raise 'Post-move collection verification failed; inspect journal before proceeding' unless !File.exist?(s)&&CompleteFiling.same_tree?(d,o['tree'])
          @core.append_event(run,{'event'=>'moved_verified','id'=>o['id'],'source'=>s,'destination'=>d,'members'=>o['tree'].length})
          count+=1
          puts "Verified #{count} filed items..." if count%100==0
        rescue StandardError=>e
          @core.append_event(run,{'event'=>'error','id'=>o['id'],'source'=>s,'reason'=>e.message})
          warn "Stopped: #{e.message}"
          break
        end
      end
      verify(run,p)
    end

    def verify(run,p)
      states=p['operations'].map do |o|
        s,d=o.values_at('source','destination')
        status,actual=if o['tree']&&CompleteFiling.same_tree?(d,o['tree'])&&!File.exist?(s)
          ['MOVED_VERIFIED',d]
        elsif o['tree']&&CompleteFiling.same_tree?(s,o['tree'])
          ['RETAINED_VERIFIED',s]
        elsif File.exist?(s)
          ['CHANGED_OR_BLOCKED_REVIEW',s]
        elsif File.exist?(d)
          ['DESTINATION_CHANGED_REVIEW',d]
        else
          ['MISSING_REVIEW',s]
        end
        o.merge('status'=>status,'actual'=>actual)
      end
      @core.write_csv(File.join(run,'Move-verification.csv'),%w[Name Kind Status Original_location Actual_location Members],
        states.map{|o|[File.basename(o['source']),o['kind'],o['status'],o['source'],o['actual'],(o['tree']||{}).length]})
      snap=@core.snapshot
      @core.write_json(File.join(run,"scan-scope-#{Time.now.strftime('%H%M%S')}-#{SecureRandom.hex(2)}.json"),
        {'errors'=>snap['errors'],'exclusions'=>snap['exclusions'],'roots'=>@core.roots})
      mapping={}
      states.each do |o|
        (o['tree']||{}).each_key do |rel|
          actual=rel=='.' ? o['actual'] : File.join(o['actual'],rel)
          original=rel=='.' ? o['source'] : File.join(o['source'],rel)
          mapping[actual]=[original,o['category'],o['status'],o['topic']]
        end
      end
      @core.write_csv(File.join(run,'Where-Everything-Is.csv'),%w[Name Actual_location Kind Category Topic Filing_status Previous_location Logical_bytes],
        snap['entries'].map do |e|
          path=e['path']; old,cat,status,topic=mapping[path]
          if !cat
            relative=Filing.within?(path,@cloud) ? path[(@cloud.length+1)..-1] : path.sub(@home+'/','')
            cat=relative.split('/').first
            status='PRESERVED_EXISTING_LOCATION'
            topic=e['kind']=='file' ? (entity_category(File.basename(path),e.fetch('fingerprint',{}).fetch('mtime',Time.now.to_f))||cat) : cat
          end
          [File.basename(path),path,e['kind'],cat,topic,status,old,e['size']]
        end)
      residuals=[]; seen=Set.new
      @roots.each do |r|
        next unless File.directory?(r)
        id=[File.stat(r).dev,File.stat(r).ino];next if seen.include?(id);seen<<id
        Dir.children(r).reject{|n|n.start_with?('.')}.each do |n|
          path=File.join(r,n)
          residuals<<[path,'Visible loose file remains; see journal for skipped items'] if File.file?(path)&&!File.symlink?(path)
        end
      end
      @core.write_csv(File.join(run,'Remaining-loose-files.csv'),%w[Location Reason],residuals)
      counts=states.group_by{|o|o['status']}.transform_values(&:length)
      File.write(File.join(run,'Verification.md'),"# Comprehensive filing verification\n\nChecked #{Time.now.iso8601}.\n\n"+
        counts.map{|k,v|"- #{k}: #{v}"}.join("\n")+
        "\n\n- Visible loose files remaining in scoped top-level locations: #{residuals.length}.\n- Current index entries: #{snap['entries'].length}.\n- Scan errors: #{snap['errors'].length}.\n\n"+
        "No permanent deletion or duplicate removal. Verification compares item identity and each collection's member metadata, not hashes or iCloud upload status. Hidden/system data, package internals, and app-managed locations are excluded or preserved. Every exception is reported; zero loose files is not assumed.\n")
      puts "Verification: #{counts}; loose files remaining=#{residuals.length}; scan errors=#{snap['errors'].length}"
      states
    end

    def undo(run,p)
      validate!(p)
      ops=p['operations'].map{|o|[o['id'],o]}.to_h
      opens=@core.open_files
      @core.read_journal(run).select{|e|e['event']=='intent'}.reverse.each do |e|
        o=ops[e['id']]
        raise 'Journal/plan mismatch' unless o&&o['source']==e['source']&&o['destination']==e['destination']
        s,d=o.values_at('source','destination')
        next if CompleteFiling.same_tree?(s,o['tree'])
        if File.exist?(s)||File.symlink?(s)||!CompleteFiling.same_tree?(d,o['tree'])||opens.any?{|x|x==d||Filing.within?(x,d)}
          @core.append_event(run,{'event'=>'undo_skipped','id'=>o['id'],'reason'=>'Original occupied, destination changed or item open'})
          next
        end
        Filing.safe_ancestors!(s)
        @core.append_event(run,{'event'=>'undo_intent','id'=>o['id']})
        Filing.atomic_move(d,s)
        raise 'Undo verification failed' unless CompleteFiling.same_tree?(s,o['tree'])
        @core.append_event(run,{'event'=>'undo_verified','id'=>o['id']})
      end
      verify(run,p)
    end
  end

  def self.main
    raise 'macOS required' unless RUBY_PLATFORM.include?('darwin')
    runner=Runner.new
    File.open(File.join(runner.tool,'.finish-filing.lock'),File::RDWR|File::CREAT,0600) do |lock|
      raise 'Another filing run is active' unless lock.flock(File::LOCK_EX|File::LOCK_NB)
      mode=ARGV.first||'preview'
      case mode
      when 'preview','finish'
        puts 'Building a fresh, complete filing plan. No deletion. Keep documents closed during execution.'
        run,p=runner.plan
        puts File.read(File.join(run,'Preview.md'))
        puts "\nReports: #{run}"
        if mode=='finish'
          # The user explicitly authorized this complete second pass.
          # Launching Finish Filing.command is the local execution action.
          runner.apply(run,p)
          system('/usr/bin/open',runner.cloud)
          system('/usr/bin/open','-R',File.join(run,'Verification.md'))
        else
          runner.verify(run,p)
          puts 'PREVIEW ONLY. No files moved.'
          system('/usr/bin/open','-R',File.join(run,'Preview.csv'))
        end
      when 'verify','undo'
        run=Dir.glob(File.join(runner.tool,'Runs','*')).select{|r|File.file?(File.join(r,'plan.json'))}.sort.last
        raise 'No prior run found' unless run
        p=JSON.parse(File.read(File.join(run,'plan.json')))
        if mode=='undo'
          puts 'Type UNDO to reverse unchanged moves from the latest second-pass run.'
          runner.undo(run,p) if STDIN.gets.to_s.strip=='UNDO'
        else
          runner.verify(run,p)
        end
        puts "Reports: #{run}"
      else
        raise 'Use preview, finish, verify or undo'
      end
    end
  rescue Interrupt
    warn 'Interrupted. Keep Runs/journal.jsonl. Verify before resuming; completed moves are recorded.'
  rescue StandardError=>e
    warn "STOPPED: #{e.message}"
    exit 1
  end
end

CompleteFiling.main if __FILE__==$PROGRAM_NAME
