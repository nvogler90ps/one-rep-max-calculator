// .gitignore template database
// Each template has: id, name, category, patterns (with comments)

const TEMPLATES = [
  // ===== Languages =====
  {
    id: "python",
    name: "Python",
    category: "Languages",
    patterns: `# Python bytecode and cache
__pycache__/
*.py[cod]
*$py.class

# Distribution / packaging
dist/
build/
*.egg-info/
*.egg
eggs/
*.whl
sdist/

# Virtual environments
.venv/
venv/
ENV/
env/

# Python-specific config
*.pyo
*.pdb
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
coverage.xml
*.cover
.hypothesis/
.pytest_cache/
nosetests.xml

# Mypy type checker
.mypy_cache/

# Pyright type checker
.pyright/

# Environments
.env
.env.local`
  },
  {
    id: "javascript",
    name: "JavaScript / Node.js",
    category: "Languages",
    patterns: `# Dependencies
node_modules/

# Build output
dist/
build/
out/

# Environment variables
.env
.env.local
.env.*.local

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage
coverage/
*.lcov
.nyc_output/

# Package manager caches
.npm/
.yarn/cache
.yarn/unplugged
.yarn/install-state.gz
.pnp.*

# Optional npm cache
.eslintcache

# Compiled binary addons
build/Release/`
  },
  {
    id: "typescript",
    name: "TypeScript",
    category: "Languages",
    patterns: `# TypeScript compiled output
*.js.map
*.d.ts
!src/**/*.d.ts

# TypeScript build info
*.tsbuildinfo

# Dependencies (if Node-based)
node_modules/

# Build output
dist/
build/
out/

# Environment variables
.env
.env.local
.env.*.local

# Debug logs
npm-debug.log*
yarn-debug.log*

# Coverage
coverage/
.nyc_output/`
  },
  {
    id: "go",
    name: "Go",
    category: "Languages",
    patterns: `# Go compiled binaries
*.exe
*.exe~
*.dll
*.so
*.dylib

# Go test binary
*.test

# Go coverage profiles
*.out
coverage.txt

# Go workspace file
go.work

# Vendor directory (if not committing deps)
# vendor/

# Build output directory
bin/

# Go debug files
__debug_bin*`
  },
  {
    id: "rust",
    name: "Rust",
    category: "Languages",
    patterns: `# Rust compiled output
/target/
**/*.rs.bk

# Cargo.lock for libraries (keep for binaries)
# Cargo.lock

# Debug files
*.pdb`
  },
  {
    id: "java",
    name: "Java",
    category: "Languages",
    patterns: `# Java compiled class files
*.class

# Log files
*.log

# Package files
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar

# Build directories
target/
build/
out/

# Virtual machine crash logs
hs_err_pid*
replay_pid*

# Gradle
.gradle/
build/

# Maven
target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
pom.xml.next
release.properties`
  },
  {
    id: "csharp",
    name: "C#",
    category: "Languages",
    patterns: `# Build results
[Dd]ebug/
[Rr]elease/
x64/
x86/
[Aa][Rr][Mm]/
[Aa][Rr][Mm]64/
bld/
[Bb]in/
[Oo]bj/
[Ll]og/
[Ll]ogs/

# NuGet
*.nupkg
*.snupkg
.nuget/
packages/

# User-specific files
*.suo
*.user
*.userosscache
*.sln.docstates

# Build results
*.dll
*.exe
*.pdb

# .NET Core
project.lock.json
project.fragment.lock.json
artifacts/`
  },
  {
    id: "cpp",
    name: "C / C++",
    category: "Languages",
    patterns: `# Compiled object files
*.o
*.obj
*.ko
*.elf

# Precompiled headers
*.gch
*.pch

# Compiled dynamic libraries
*.so
*.dylib
*.dll

# Compiled static libraries
*.a
*.lib
*.la
*.lo

# Executables
*.exe
*.out
*.app

# Debug files
*.dSYM/
*.su
*.idb
*.pdb

# Build directories
build/
cmake-build-*/
CMakeFiles/
CMakeCache.txt
cmake_install.cmake
Makefile

# Dependency files
*.d`
  },
  {
    id: "ruby",
    name: "Ruby",
    category: "Languages",
    patterns: `# Bundler
/.bundle/
/vendor/bundle
Gemfile.lock

# Build output
/build/
/pkg/
*.gem

# Ruby-specific
*.rbc
/.config
/coverage/
/InstalledFiles
/spec/reports/
/spec/examples.txt
/test/tmp/
/test/version_tmp/
/tmp/

# Environment
.env
.env.local

# RVM / rbenv / chruby
.ruby-version
.ruby-gemset
.rvmrc`
  },
  {
    id: "php",
    name: "PHP",
    category: "Languages",
    patterns: `# Composer dependency directory
/vendor/
composer.phar

# Environment
.env
.env.local
.env.*.local

# PHPUnit
.phpunit.result.cache
.phpunit.cache/

# PHP CS Fixer
.php-cs-fixer.cache

# Logs
*.log

# Build / cache
/storage/*.key
/storage/framework/cache/*
/storage/framework/sessions/*
/storage/framework/views/*`
  },
  {
    id: "swift",
    name: "Swift",
    category: "Languages",
    patterns: `# Xcode build artifacts
build/
DerivedData/
*.moved-aside
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3

# Swift Package Manager
.build/
Packages/
Package.resolved
.swiftpm/

# CocoaPods
Pods/

# Carthage
Carthage/Build/
Carthage/Checkouts/

# Fastlane
fastlane/report.xml
fastlane/Preview.html
fastlane/screenshots/**/*.png
fastlane/test_output`
  },
  {
    id: "kotlin",
    name: "Kotlin",
    category: "Languages",
    patterns: `# Kotlin compiled output
*.class
*.jar
*.war

# Gradle
.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar

# Kotlin-specific
*.kotlin_module

# IntelliJ IDEA (commonly used with Kotlin)
.idea/
*.iml
out/

# Maven
target/`
  },

  // ===== Frameworks =====
  {
    id: "react",
    name: "React",
    category: "Frameworks",
    patterns: `# Dependencies
node_modules/

# Build output
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug logs
npm-debug.log*
yarn-debug.log*

# Coverage
coverage/

# Misc
.eslintcache
.cache/`
  },
  {
    id: "nextjs",
    name: "Next.js",
    category: "Frameworks",
    patterns: `# Dependencies
node_modules/

# Next.js build output
.next/
out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug logs
npm-debug.log*
yarn-debug.log*

# Vercel
.vercel

# Testing
coverage/

# Misc
.eslintcache
*.tsbuildinfo
next-env.d.ts`
  },
  {
    id: "vue",
    name: "Vue",
    category: "Frameworks",
    patterns: `# Dependencies
node_modules/

# Build output
dist/

# Environment variables
.env
.env.local
.env.*.local

# Debug logs
npm-debug.log*
yarn-debug.log*

# Editor directories and files
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Misc
.eslintcache`
  },
  {
    id: "angular",
    name: "Angular",
    category: "Frameworks",
    patterns: `# Dependencies
node_modules/

# Build output
dist/
tmp/
out-tsc/

# Angular cache
.angular/

# Environment variables
.env

# Debug logs
npm-debug.log*
yarn-debug.log*

# Testing
coverage/

# Compiled output
/bazel-out

# Misc
.eslintcache
*.tsbuildinfo`
  },
  {
    id: "django",
    name: "Django",
    category: "Frameworks",
    patterns: `# Python
__pycache__/
*.py[cod]
*.so

# Virtual environment
.venv/
venv/
env/

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Static files (collected)
/staticfiles/
/static_collected/

# Media uploads
/media/

# Environment variables
.env
.env.local

# Coverage
htmlcov/
.coverage
.coverage.*
.pytest_cache/

# Celery
celerybeat-schedule
celerybeat.pid`
  },
  {
    id: "flask",
    name: "Flask",
    category: "Frameworks",
    patterns: `# Python
__pycache__/
*.py[cod]
*.so

# Virtual environment
.venv/
venv/
env/

# Flask
instance/
.webassets-cache

# Environment variables
.env
.env.local

# Database
*.db
*.sqlite3

# Coverage
htmlcov/
.coverage
.pytest_cache/

# Distribution
dist/
build/
*.egg-info/`
  },
  {
    id: "rails",
    name: "Rails",
    category: "Frameworks",
    patterns: `# Bundler
/vendor/bundle

# Ruby / Rails
*.rbc
capybara-*.html
/log/*
/tmp/*
!/log/.keep
!/tmp/.keep

# Database
/db/*.sqlite3
/db/*.sqlite3-journal
/db/*.sqlite3-shm
/db/*.sqlite3-wal

# Environment
.env
.env.local
/config/master.key
/config/credentials/*.key

# Storage
/storage/*
!/storage/.keep

# Public uploads
/public/uploads
/public/packs
/public/packs-test
/public/assets

# Node modules (if Webpacker)
/node_modules

# Yarn
yarn-error.log
.yarn-integrity`
  },
  {
    id: "spring-boot",
    name: "Spring Boot",
    category: "Frameworks",
    patterns: `# Java compiled output
*.class
target/

# Gradle
.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar

# Maven
target/
pom.xml.tag
pom.xml.releaseBackup

# Spring Boot
*.jar
*.war

# Application properties (if contains secrets)
# application-local.properties
# application-local.yml

# Logs
*.log
logs/

# Environment
.env`
  },
  {
    id: "dotnet",
    name: ".NET",
    category: "Frameworks",
    patterns: `# Build results
[Dd]ebug/
[Rr]elease/
[Bb]in/
[Oo]bj/

# NuGet
*.nupkg
.nuget/
packages/

# User-specific files
*.suo
*.user
*.userosscache
*.sln.docstates

# Build results
[Ll]og/
[Ll]ogs/

# Visual Studio
.vs/
*.rsuser
*.userprefs

# .NET Core
project.lock.json
artifacts/

# ASP.NET Scaffolding
ScaffoldingReadMe.txt

# Windows image file caches
Thumbs.db
ehthumbs.db

# Environment
.env
appsettings.Development.json`
  },
  {
    id: "unity",
    name: "Unity",
    category: "Frameworks",
    patterns: `# Unity generated directories
/[Ll]ibrary/
/[Tt]emp/
/[Oo]bj/
/[Bb]uild/
/[Bb]uilds/
/[Ll]ogs/
/[Uu]ser[Ss]ettings/

# MemoryCaptures
/[Mm]emoryCaptures/

# Recordings
/[Rr]ecordings/

# Asset meta data (only ignore for text serialization)
# *.meta

# Autogenerated VS/MD/Rider solution and project files
ExportedObj/
.consulo/
*.csproj
*.unityproj
*.sln
*.suo
*.tmp
*.user
*.userprefs
*.pidb
*.booproj
*.svd
*.pdb
*.mdb
*.opendb
*.odb

# Unity3D generated meta files
*.pidb.meta
*.pdb.meta
*.mdb.meta

# Unity3D generated file on crash reports
sysinfo.txt

# Builds
*.apk
*.aab
*.unitypackage
*.app

# Crashlytics
crashlytics-build.properties

# Addressables
/[Aa]ssets/[Aa]ddressable[Aa]ssets[Dd]ata/*/*.bin*
/[Aa]ssets/[Ss]treamingAssets/aa.meta
/[Aa]ssets/[Ss]treamingAssets/aa/*`
  },
  {
    id: "unreal",
    name: "Unreal Engine",
    category: "Frameworks",
    patterns: `# Unreal Engine build directories
Binaries/
Build/
DerivedDataCache/
Intermediate/
Saved/

# Unreal auto-generated files
*.VC.db
*.opensdf
*.opendb
*.sdf
*.suo
*.sln
*.xcodeproj
*.xcworkspace

# Compiled assets
*.uasset
*.umap

# Local user settings
*.DotSettings.user

# Visual Studio
.vs/

# Rider
.idea/

# Clang
.clang/`
  },

  // ===== IDEs / Editors =====
  {
    id: "vscode",
    name: "VS Code",
    category: "IDEs / Editors",
    patterns: `# VS Code directories
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
!.vscode/*.code-snippets

# Local history (VS Code extension)
.history/

# Built VS Code extensions
*.vsix`
  },
  {
    id: "jetbrains",
    name: "IntelliJ / JetBrains",
    category: "IDEs / Editors",
    patterns: `# JetBrains IDEs
.idea/
*.iml
*.iws
*.ipr

# JetBrains CMake
cmake-build-*/

# File-based project format
*.iws

# IntelliJ out directory
out/

# mpeltonen/sbt-idea plugin
.idea_modules/

# JIRA plugin
atlassian-ide-plugin.xml

# Crashlytics
com_crashlytics_export_strings.xml
crashlytics.properties
crashlytics-build.properties
fabric.properties`
  },
  {
    id: "vim",
    name: "Vim",
    category: "IDEs / Editors",
    patterns: `# Vim swap files
[._]*.s[a-v][a-z]
!*.svg
[._]*.sw[a-p]
[._]s[a-rt-v][a-z]
[._]ss[a-gi-z]
[._]sw[a-p]

# Vim session files
Session.vim
Sessionx.vim

# Vim temporary files
.netrwhist
*~

# Vim auto-generated tag files
tags

# Persistent undo
[._]*.un~`
  },
  {
    id: "emacs",
    name: "Emacs",
    category: "IDEs / Editors",
    patterns: `# Emacs backup and autosave files
*~
\\#*\\#
/.emacs.desktop
/.emacs.desktop.lock
*.elc
auto-save-list
tramp
.\\#*

# Org-mode
.org-id-locations
*_archive

# Flycheck
flycheck_*.el

# Projectile bookmarks
projectile-bookmarks.eld

# Directory configuration
.dir-locals.el

# Network security
/network-security.data`
  },
  {
    id: "xcode",
    name: "Xcode",
    category: "IDEs / Editors",
    patterns: `# Xcode user data
xcuserdata/
*.xccheckout
*.moved-aside
*.xcuserstate
*.xcscmblueprint

# Xcode build
build/
DerivedData/

# Xcode auto-generated
*.hmap
*.ipa
*.dSYM.zip
*.dSYM

# Playgrounds
timeline.xctimeline
playground.xcworkspace`
  },
  {
    id: "visualstudio",
    name: "Visual Studio",
    category: "IDEs / Editors",
    patterns: `# Visual Studio cache/options directory
.vs/

# User-specific files
*.rsuser
*.suo
*.user
*.userosscache
*.sln.docstates

# Build results
[Dd]ebug/
[Rr]elease/
x64/
x86/

# MSTest test results
[Tt]est[Rr]esult*/
[Bb]uild[Ll]og.*

# NuGet
**/[Pp]ackages/*
!**/[Pp]ackages/build/

# Windows
*.lnk`
  },
  {
    id: "sublimetext",
    name: "Sublime Text",
    category: "IDEs / Editors",
    patterns: `# Sublime Text cache files
*.tmlanguage.cache
*.tmPreferences.cache
*.stTheme.cache

# Sublime workspace files (user-specific)
*.sublime-workspace

# Sublime project files (optional -- may want to keep)
# *.sublime-project

# SFTP configuration
sftp-config.json
sftp-config-alt*.json

# Package control
Package Control.last-run
Package Control.ca-list
Package Control.ca-bundle
Package Control.system-ca-bundle
Package Control.cache/
Package Control.ca-certs/
Package Control.merged-ca-bundle
Package Control.user-ca-bundle
oscrypto-ca-bundle.crt
bh_unicode_properties.cache`
  },

  // ===== OS =====
  {
    id: "macos",
    name: "macOS",
    category: "OS",
    patterns: `# macOS system files
.DS_Store
.AppleDouble
.LSOverride

# macOS Thumbnails
._*

# macOS directory metadata
.Spotlight-V100
.Trashes

# Volume-specific files
.DocumentRevisions-V100
.fseventsd
.TemporaryItems
.VolumeIcon.icns
.com.apple.timemachine.donotpresent

# Directories potentially created on remote shares
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk`
  },
  {
    id: "windows",
    name: "Windows",
    category: "OS",
    patterns: `# Windows thumbnail cache
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db

# Windows Installer files
*.cab
*.msi
*.msix
*.msm
*.msp

# Windows shortcuts
*.lnk

# Windows dump files
*.stackdump

# Folder config file
[Dd]esktop.ini

# Recycle Bin used on file shares
$RECYCLE.BIN/

# Windows image file caches
*.db`
  },
  {
    id: "linux",
    name: "Linux",
    category: "OS",
    patterns: `# Linux backup files
*~

# Linux temporary files
.fuse_hidden*
.directory
.Trash-*

# Linux NFS files
.nfs*

# KDE directory preferences
.directory`
  },

  // ===== Other =====
  {
    id: "terraform",
    name: "Terraform",
    category: "Other",
    patterns: `# Terraform local state
*.tfstate
*.tfstate.*

# Crash log files
crash.log
crash.*.log

# Terraform directory
.terraform/

# Terraform lock file (keep if using consistent provider versions)
# .terraform.lock.hcl

# Variable files that may contain secrets
*.tfvars
*.tfvars.json

# Override files
override.tf
override.tf.json
*_override.tf
*_override.tf.json

# Terraform plan files
*.tfplan

# Ignore CLI configuration
.terraformrc
terraform.rc`
  },
  {
    id: "docker",
    name: "Docker",
    category: "Other",
    patterns: `# Docker override files (local dev overrides)
docker-compose.override.yml
docker-compose.override.yaml

# Docker environment files
.docker-env
.env
.env.local

# Docker data volumes
data/`
  },
  {
    id: "jupyter",
    name: "Jupyter Notebooks",
    category: "Other",
    patterns: `# Jupyter Notebook checkpoints
.ipynb_checkpoints/

# IPython profile
profile_default/
ipython_config.py

# Jupyter Notebook output (optional -- large outputs bloat repos)
# *.ipynb

# Virtual environment (commonly used with Jupyter)
.venv/
venv/

# Environment variables
.env`
  }
];

// ===== Common Stacks (presets) =====
const STACKS = [
  { name: "React", items: ["javascript", "react", "vscode", "macos", "windows"] },
  { name: "Node.js", items: ["javascript", "vscode", "macos", "windows", "linux"] },
  { name: "Python / Django", items: ["python", "django", "vscode", "macos", "windows", "linux"] },
  { name: "Go", items: ["go", "vscode", "macos", "windows", "linux"] },
  { name: "Rust", items: ["rust", "vscode", "macos", "windows", "linux"] },
  { name: "Unity", items: ["csharp", "unity", "visualstudio", "jetbrains", "macos", "windows"] },
  { name: "iOS / Swift", items: ["swift", "xcode", "macos"] },
  { name: "Android / Kotlin", items: ["kotlin", "java", "jetbrains", "macos", "windows", "linux"] },
  { name: "Java / Maven", items: ["java", "spring-boot", "jetbrains", "vscode", "macos", "windows", "linux"] }
];

// ===== "Don't Forget" Warnings =====
const WARNINGS = {
  "python": [
    "Add your .env file -- Django SECRET_KEY and database credentials are commonly leaked."
  ],
  "javascript": [
    "Never commit node_modules/ -- it can contain thousands of files and bloat your repo.",
    "Add .env files -- API keys and secrets are the #1 source of credential leaks."
  ],
  "typescript": [
    "Add .env files -- API keys in environment variables should never be committed."
  ],
  "react": [
    "Ensure .env.local is ignored -- React apps often store API URLs and keys there."
  ],
  "nextjs": [
    "Never commit .next/ -- it's regenerated on every build.",
    "Add .env.local -- Next.js loads secrets from environment files."
  ],
  "django": [
    "Never commit local_settings.py or db.sqlite3 with real data.",
    "Add your SECRET_KEY to environment variables, not settings.py."
  ],
  "rails": [
    "Never commit config/master.key or config/credentials/*.key."
  ],
  "terraform": [
    "Never commit .tfvars files -- they often contain cloud credentials and secrets.",
    "Never commit .tfstate files -- they may contain sensitive resource data."
  ],
  "docker": [
    "Add .env files -- Docker Compose often loads secrets from .env."
  ],
  "unity": [
    "Never commit the Library/ folder -- it's regenerated from Assets/ and is very large."
  ],
  "csharp": [
    "Add appsettings.Development.json if it contains local connection strings."
  ],
  "dotnet": [
    "Add appsettings.Development.json if it contains local secrets."
  ],
  "spring-boot": [
    "Add application-local.properties/yml if it contains database passwords."
  ],
  "go": [
    "Decide whether to commit vendor/ -- ignore it if using Go modules (go.sum is enough)."
  ],
  "swift": [
    "Never commit Pods/ if using CocoaPods -- use pod install to regenerate."
  ],
  "java": [
    "Add application.properties or application.yml if they contain credentials."
  ]
};

// Category display order
const CATEGORY_ORDER = ["Languages", "Frameworks", "IDEs / Editors", "OS", "Other"];
