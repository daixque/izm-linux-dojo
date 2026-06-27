#!/usr/bin/env python3
"""Generate Phase 4 lesson YAML files (chapters 7-9)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "lessons_data"

LOG_CONTENT = """2024-01-01 INFO Server started
2024-01-01 INFO Listening on port 8080
2024-01-02 WARN Low memory
2024-01-02 ERROR Connection failed
2024-01-03 INFO User login
2024-01-03 ERROR Disk full
2024-01-04 INFO Shutdown
"""

LESSONS = [
    # Chapter 07
    {
        "dir": "07_search/01_grep_basic",
        "ja_title": "grep の基本",
        "en_title": "grep Basics",
        "number": "01",
        "learn_ja": """<h2>テキストの中から探す</h2>
<p>第3章で <code>cat</code> や <code>head</code>・<code>tail</code> を使い、ファイルの<strong>中身を読む</strong>方法を学びました。ログや設定ファイルは行数が多いことがあり、必要な行だけを素早く見つけたい場面があります。</p>
<p><code>grep</code>（globally search for a regular expression and print）は、ファイルの中から<strong>指定した文字列を含む行</strong>だけを取り出すコマンドです。</p>

<h2>基本の使い方</h2>
<pre><code>grep パターン ファイル名</code></pre>
<p>「パターン」に探したい文字列を指定します。大文字と小文字は区別されます。</p>
<pre><code>$ grep ERROR app.log
2024-01-02 ERROR Connection failed
2024-01-03 ERROR Disk full</code></pre>
<p>上の例では、<code>app.log</code> の中から <code>ERROR</code> という文字列を含む行だけが表示されています。</p>

<h2>複数ファイルをまとめて検索</h2>
<p>ファイル名を複数指定すると、それぞれのファイルを検索します。</p>
<pre><code>grep ERROR log1.txt log2.txt</code></pre>

<h2>見つからないとき</h2>
<p>パターンに一致する行がない場合、grep は何も表示せず終了します（エラーではありません）。</p>

<h2>次のステップ</h2>
<p>演習ページで <code>grep</code> を使い、ログファイルから ERROR 行を抽出してみましょう！</p>""",
        "learn_en": """<h2>Search Inside Text</h2>
<p>In Chapter 3 you learned to read file contents with <code>cat</code>, <code>head</code>, and <code>tail</code>. Logs and config files can be long, and you often need to find specific lines quickly.</p>
<p><code>grep</code> prints only the lines that <strong>contain a given string</strong>.</p>

<h2>Basic Usage</h2>
<pre><code>grep PATTERN FILENAME</code></pre>
<p>Specify the text you want to find as the pattern. Matching is case-sensitive by default.</p>
<pre><code>$ grep ERROR app.log
2024-01-02 ERROR Connection failed
2024-01-03 ERROR Disk full</code></pre>

<h2>Search Multiple Files</h2>
<pre><code>grep ERROR log1.txt log2.txt</code></pre>

<h2>When Nothing Matches</h2>
<p>If no line matches, grep prints nothing and exits (this is not an error).</p>

<h2>Next Step</h2>
<p>On the exercise page, use <code>grep</code> to extract ERROR lines from a log file!</p>""",
        "exercise_ja": {
            "description": "grep を使ってログファイルから ERROR 行を抽出します。",
            "task": "<p>ホームディレクトリにある <code>app.log</code> から、<code>ERROR</code> を含む行だけを <code>grep</code> で表示しましょう。</p>",
            "instructions": [
                "<code>ls</code> で <code>app.log</code> があることを確認します",
                "<code>grep ERROR app.log</code> を実行します",
                "ERROR 行が 2 行表示されることを確認します",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "パターン（ERROR）とファイル名の間にスペースを入れます",
                "大文字小文字が一致しているか確認してください",
            ],
        },
        "exercise_en": {
            "description": "Use grep to extract ERROR lines from a log file.",
            "task": "<p>Use <code>grep</code> to show only lines containing <code>ERROR</code> in <code>app.log</code>.</p>",
            "instructions": [
                "Run <code>ls</code> to confirm <code>app.log</code> exists",
                "Run <code>grep ERROR app.log</code>",
                "Confirm that two ERROR lines are displayed",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "Put a space between the pattern (ERROR) and the filename",
                "Check that uppercase and lowercase match exactly",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {
                        "app.log": {"type": "file", "content": LOG_CONTENT},
                    },
                }
            },
            "solution": ["grep ERROR app.log"],
            "cases": [
                {
                    "name_ja": "ERROR 行が 2 行表示される",
                    "name_en": "Two ERROR lines are displayed",
                    "desc_ja": "grep ERROR app.log の出力を確認",
                    "desc_en": "Verify grep ERROR app.log output",
                    "type": "command_output",
                    "command": "grep ERROR app.log",
                    "expected": "2024-01-02 ERROR Connection failed\n2024-01-03 ERROR Disk full\n",
                },
            ],
        },
    },
    {
        "dir": "07_search/02_grep_options",
        "ja_title": "grep のオプション",
        "en_title": "grep Options",
        "number": "02",
        "learn_ja": """<h2>grep をもっと便利に</h2>
<p>前のレッスンで <code>grep</code> の基本を学びました。オプション（フラグ）を付けると、検索の仕方を細かく調整できます。</p>

<h3><code>-i</code> — 大文字小文字を無視</h3>
<pre><code>$ grep -i error app.log</code></pre>
<p><code>ERROR</code> も <code>error</code> も <code>Error</code> も一致します。</p>

<h3><code>-n</code> — 行番号を表示</h3>
<pre><code>$ grep -n ERROR app.log
4:2024-01-02 ERROR Connection failed
6:2024-01-03 ERROR Disk full</code></pre>
<p>何行目に見つかったかが分かり、あとで <code>head</code> などと組み合わせやすくなります。</p>

<h3><code>-v</code> — 一致しない行を表示（反転）</h3>
<pre><code>$ grep -v ERROR app.log</code></pre>
<p>ERROR を<strong>含まない</strong>行だけが表示されます。</p>

<h3><code>-c</code> — 一致行数だけを表示</h3>
<pre><code>$ grep -c ERROR app.log
2</code></pre>
<p>件数だけ知りたいときに便利です。</p>

<h2>次のステップ</h2>
<p>演習ページで、いくつかのオプションを試してみましょう！</p>""",
        "learn_en": """<h2>More Useful grep</h2>
<p>In the previous lesson you learned grep basics. Options let you fine-tune how searching works.</p>

<h3><code>-i</code> — Ignore Case</h3>
<pre><code>$ grep -i error app.log</code></pre>

<h3><code>-n</code> — Show Line Numbers</h3>
<pre><code>$ grep -n ERROR app.log
4:2024-01-02 ERROR Connection failed
6:2024-01-03 ERROR Disk full</code></pre>

<h3><code>-v</code> — Invert Match</h3>
<p>Show lines that do <strong>not</strong> contain the pattern.</p>

<h3><code>-c</code> — Count Matches</h3>
<pre><code>$ grep -c ERROR app.log
2</code></pre>

<h2>Next Step</h2>
<p>Try several options on the exercise page!</p>""",
        "exercise_ja": {
            "description": "grep の -n と -c オプションを使います。",
            "task": "<p><code>app.log</code> に対して、行番号付きの検索と件数カウントを行いましょう。</p>",
            "instructions": [
                "<code>grep -n ERROR app.log</code> で行番号付きで ERROR 行を表示します",
                "<code>grep -c ERROR app.log</code> で ERROR 行の件数を確認します",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "オプションはパターンの前に付けます: <code>grep -n パターン ファイル</code>",
                "-c の結果は数字 1 行だけです",
            ],
        },
        "exercise_en": {
            "description": "Use grep -n and grep -c options.",
            "task": "<p>Search <code>app.log</code> with line numbers and count matches.</p>",
            "instructions": [
                "Run <code>grep -n ERROR app.log</code> to show ERROR lines with line numbers",
                "Run <code>grep -c ERROR app.log</code> to count ERROR lines",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "Put options before the pattern: <code>grep -n PATTERN FILE</code>",
                "-c prints a single number",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {
                        "app.log": {"type": "file", "content": LOG_CONTENT},
                    },
                }
            },
            "solution": ["grep -n ERROR app.log", "grep -c ERROR app.log"],
            "cases": [
                {
                    "name_ja": "行番号付き grep",
                    "name_en": "grep with line numbers",
                    "desc_ja": "grep -n の出力を確認",
                    "desc_en": "Verify grep -n output",
                    "type": "command_output",
                    "command": "grep -n ERROR app.log",
                    "expected": "4:2024-01-02 ERROR Connection failed\n6:2024-01-03 ERROR Disk full\n",
                },
                {
                    "name_ja": "件数カウント",
                    "name_en": "Match count",
                    "desc_ja": "grep -c の出力を確認",
                    "desc_en": "Verify grep -c output",
                    "type": "command_output",
                    "command": "grep -c ERROR app.log",
                    "expected": "2\n",
                },
            ],
        },
    },
    {
        "dir": "07_search/03_find",
        "ja_title": "find で探す",
        "en_title": "Finding Files with find",
        "number": "03",
        "learn_ja": """<h2>ファイル名で探す</h2>
<p><code>grep</code> はファイルの<strong>中身</strong>を検索します。一方、ファイル<strong>名</strong>や場所を探すときは <code>find</code> コマンドを使います。</p>

<h2>基本の形</h2>
<pre><code>find ディレクトリ -name パターン</code></pre>
<ul>
  <li><strong>ディレクトリ</strong> — 検索を始める場所（<code>.</code> はカレントディレクトリ）</li>
  <li><strong>-name</strong> — ファイル名で探すオプション</li>
  <li><strong>パターン</strong> — ファイル名のパターン（ワイルドカード <code>*</code> が使える）</li>
</ul>

<h2>例: .txt ファイルをすべて探す</h2>
<pre><code>$ find . -name "*.txt"
./notes.txt
./documents/readme.txt</code></pre>
<p><code>*</code> は「任意の文字列」を表します。<code>*.txt</code> は「.txt で終わる名前」という意味です。</p>

<h2>サブディレクトリも再帰的に探す</h2>
<p><code>find</code> は指定したディレクトリの<strong>下の階層すべて</strong>をたどります。深いフォルダの中にあるファイルも見つかります。</p>

<h2>次のステップ</h2>
<p>演習ページで <code>find</code> を使い、.txt ファイルを列挙してみましょう！</p>""",
        "learn_en": """<h2>Search by Filename</h2>
<p><code>grep</code> searches file <strong>contents</strong>. To search by file <strong>name</strong>, use <code>find</code>.</p>

<h2>Basic Form</h2>
<pre><code>find DIRECTORY -name PATTERN</code></pre>
<ul>
  <li><strong>DIRECTORY</strong> — where to start (<code>.</code> means current directory)</li>
  <li><strong>-name</strong> — search by filename</li>
  <li><strong>PATTERN</strong> — filename pattern (wildcards like <code>*</code> work)</li>
</ul>

<h2>Example: Find All .txt Files</h2>
<pre><code>$ find . -name "*.txt"
./notes.txt
./documents/readme.txt</code></pre>

<h2>Searches Subdirectories Too</h2>
<p><code>find</code> walks the entire tree under the given directory.</p>

<h2>Next Step</h2>
<p>On the exercise page, use <code>find</code> to list .txt files!</p>""",
        "exercise_ja": {
            "description": "find コマンドで .txt ファイルを検索します。",
            "task": "<p>カレントディレクトリ以下から、拡張子 <code>.txt</code> のファイルをすべて <code>find</code> で探しましょう。</p>",
            "instructions": [
                "<code>ls</code> でホームディレクトリの構造を確認します",
                "<code>find . -name \"*.txt\"</code> を実行します",
                "3 つの .txt ファイルが見つかることを確認します",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "パターンはダブルクォートで囲むと安全です: <code>\"*.txt\"</code>",
                "<code>.</code> は「今いるディレクトリ」を意味します",
            ],
        },
        "exercise_en": {
            "description": "Use find to search for .txt files.",
            "task": "<p>Find all files ending in <code>.txt</code> under the current directory.</p>",
            "instructions": [
                "Run <code>ls</code> to see the home directory structure",
                "Run <code>find . -name \"*.txt\"</code>",
                "Confirm that three .txt files are found",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "Quote the pattern: <code>\"*.txt\"</code>",
                "<code>.</code> means the current directory",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {
                        "notes.txt": {"type": "file", "content": "memo\n"},
                        "data.log": {"type": "file", "content": "log\n"},
                        "documents": {
                            "type": "directory",
                            "children": {
                                "readme.txt": {"type": "file", "content": "readme\n"},
                                "config": {
                                    "type": "directory",
                                    "children": {
                                        "settings.txt": {"type": "file", "content": "settings\n"},
                                    },
                                },
                            },
                        },
                    },
                }
            },
            "solution": ['find . -name "*.txt"'],
            "cases": [
                {
                    "name_ja": ".txt ファイルが 3 つ見つかる",
                    "name_en": "Three .txt files found",
                    "desc_ja": "find の出力を確認",
                    "desc_en": "Verify find output",
                    "type": "command_output",
                    "command": 'find . -name "*.txt"',
                    "expected": "/home/user/documents/config/settings.txt\n/home/user/documents/readme.txt\n/home/user/notes.txt\n",
                    "sort": True,
                },
            ],
        },
    },
    {
        "dir": "07_search/04_wildcard",
        "ja_title": "ワイルドカード",
        "en_title": "Wildcards",
        "number": "04",
        "learn_ja": """<h2>ファイル名のパターン指定</h2>
<p><code>find -name "*.txt"</code> で見た <code>*</code> は<strong>ワイルドカード</strong>と呼ばれ、ファイル名の一部をざっくり指定できます。シェルはコマンドを実行する前に、ワイルドカードを<strong>実際のファイル名に展開</strong>します。</p>

<h2>主なワイルドカード</h2>
<table>
  <tr><th>記号</th><th>意味</th><th>例</th></tr>
  <tr><td><code>*</code></td><td>任意の文字列（0 文字以上）</td><td><code>*.txt</code> → notes.txt, readme.txt</td></tr>
  <tr><td><code>?</code></td><td>任意の 1 文字</td><td><code>file?.txt</code> → file1.txt, fileA.txt</td></tr>
</table>

<h2><code>ls *.txt</code> の例</h2>
<pre><code>$ ls *.txt
notes.txt  readme.txt</code></pre>
<p>シェルは <code>*.txt</code> を、カレントディレクトリで .txt で終わるファイル名に置き換えてから <code>ls</code> を実行します。</p>

<h2>find との違い</h2>
<ul>
  <li><strong>ワイルドカード</strong> — シェルが展開（主に 1 階層・カレント付近）</li>
  <li><strong>find</strong> — サブディレクトリも含めて再帰的に検索</li>
</ul>

<h2>次のステップ</h2>
<p>演習ページで <code>ls *.txt</code> を試し、ワイルドカードの展開を確認しましょう！</p>""",
        "learn_en": """<h2>Filename Patterns</h2>
<p>The <code>*</code> in <code>find -name "*.txt"</code> is a <strong>wildcard</strong>. The shell expands wildcards into matching filenames <strong>before</strong> running the command.</p>

<h2>Common Wildcards</h2>
<table>
  <tr><th>Symbol</th><th>Meaning</th><th>Example</th></tr>
  <tr><td><code>*</code></td><td>Any string (0 or more chars)</td><td><code>*.txt</code></td></tr>
  <tr><td><code>?</code></td><td>Any single character</td><td><code>file?.txt</code></td></tr>
</table>

<h2>Example: <code>ls *.txt</code></h2>
<pre><code>$ ls *.txt
notes.txt  readme.txt</code></pre>

<h2>Wildcards vs find</h2>
<ul>
  <li><strong>Wildcards</strong> — expanded by the shell (usually one directory level)</li>
  <li><strong>find</strong> — recursive search through subdirectories</li>
</ul>

<h2>Next Step</h2>
<p>Try <code>ls *.txt</code> on the exercise page!</p>""",
        "exercise_ja": {
            "description": "ワイルドカードを使って特定拡張子のファイルを一覧します。",
            "task": "<p><code>ls *.txt</code> で、ホームディレクトリにある .txt ファイルだけを一覧表示しましょう。</p>",
            "instructions": [
                "<code>ls</code> で全体のファイルを確認します",
                "<code>ls *.txt</code> を実行します",
                ".txt ファイルだけが表示されることを確認します",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "ワイルドカード <code>*</code> はシェルが自動的に展開します",
                "一致するファイルがないと、パターンがそのまま表示されることがあります",
            ],
        },
        "exercise_en": {
            "description": "List files of a specific extension using wildcards.",
            "task": "<p>Run <code>ls *.txt</code> to list only .txt files in the home directory.</p>",
            "instructions": [
                "Run <code>ls</code> to see all files",
                "Run <code>ls *.txt</code>",
                "Confirm only .txt files are listed",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "The shell expands <code>*</code> automatically",
                "If nothing matches, the pattern may appear literally",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {
                        "notes.txt": {"type": "file", "content": "memo\n"},
                        "readme.txt": {"type": "file", "content": "readme\n"},
                        "data.log": {"type": "file", "content": "log\n"},
                        "draft.md": {"type": "file", "content": "draft\n"},
                    },
                }
            },
            "solution": ["ls *.txt"],
            "cases": [
                {
                    "name_ja": "ls *.txt で .txt だけ表示",
                    "name_en": "ls *.txt shows only .txt files",
                    "desc_ja": "ワイルドカード展開後の ls 出力",
                    "desc_en": "Verify ls output after glob expansion",
                    "type": "command_output",
                    "command": "ls *.txt",
                    "expected": "notes.txt\nreadme.txt\n",
                    "sort": True,
                },
            ],
        },
    },
]

# Continue with chapters 8 and 9 in part 2...
CHAPTER_08_09 = [
    {
        "dir": "08_pipe_redirect/01_redirect_out",
        "ja_title": "出力リダイレクト",
        "en_title": "Output Redirection",
        "number": "01",
        "learn_ja": """<h2>画面の代わりにファイルへ</h2>
<p>これまで、コマンドの結果（<strong>標準出力</strong>）はターミナル画面に表示されていました。第7章の <code>grep</code> や <code>ls</code> も同様です。</p>
<p><code>&gt;</code>（リダイレクト）を使うと、出力を<strong>ファイルに書き込む</strong>ことができます。</p>

<h2><code>&gt;</code> — ファイルに書き込む（上書き）</h2>
<pre><code>$ ls &gt; filelist.txt</code></pre>
<p><code>ls</code> の結果が画面ではなく <code>filelist.txt</code> に保存されます。ファイルが既にある場合は<strong>上書き</strong>されます。</p>

<h2><code>&gt;&gt;</code> — ファイルに追記</h2>
<pre><code>$ ls documents &gt;&gt; filelist.txt</code></pre>
<p>既存の内容の<strong>末尾に追加</strong>します。上書きではありません。</p>

<h2>確認方法</h2>
<p>保存した内容は <code>cat filelist.txt</code> で確認できます。</p>

<h2>次のステップ</h2>
<p>演習ページで <code>ls &gt; filelist.txt</code> を試してみましょう！</p>""",
        "learn_en": """<h2>Write to a File Instead of the Screen</h2>
<p>Until now, command output (<strong>standard output</strong>) appeared on the terminal. With <code>&gt;</code> (redirection), you can <strong>write output to a file</strong>.</p>

<h2><code>&gt;</code> — Write (Overwrite)</h2>
<pre><code>$ ls &gt; filelist.txt</code></pre>

<h2><code>&gt;&gt;</code> — Append</h2>
<pre><code>$ ls documents &gt;&gt; filelist.txt</code></pre>

<h2>Check the Result</h2>
<p>Use <code>cat filelist.txt</code> to view saved content.</p>

<h2>Next Step</h2>
<p>Try <code>ls &gt; filelist.txt</code> on the exercise page!</p>""",
        "exercise_ja": {
            "description": "ls の結果をファイルにリダイレクトします。",
            "task": "<p><code>ls</code> の出力を <code>filelist.txt</code> に保存し、内容を確認しましょう。</p>",
            "instructions": [
                "<code>ls &gt; filelist.txt</code> を実行します",
                "<code>cat filelist.txt</code> で保存された内容を確認します",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "<code>&gt;</code> の前後にスペースを入れます",
                "リダイレクト後は画面に何も表示されないのが正常です",
            ],
        },
        "exercise_en": {
            "description": "Redirect ls output to a file.",
            "task": "<p>Save <code>ls</code> output to <code>filelist.txt</code> and verify it.</p>",
            "instructions": [
                "Run <code>ls &gt; filelist.txt</code>",
                "Run <code>cat filelist.txt</code> to verify the saved content",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "Put spaces around <code>&gt;</code>",
                "No screen output after redirect is normal",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {
                        "documents": {"type": "directory", "children": {"readme.txt": {"type": "file", "content": "hi\n"}}},
                        "notes.txt": {"type": "file", "content": "memo\n"},
                    },
                }
            },
            "solution": ["ls > filelist.txt"],
            "cases": [
                {
                    "name_ja": "filelist.txt に ls 結果が保存される",
                    "name_en": "ls output saved to filelist.txt",
                    "desc_ja": "リダイレクト後のファイル内容",
                    "desc_en": "File content after redirect",
                    "type": "command_sequence",
                    "steps": [
                        {"command": "ls > filelist.txt", "expected_output": ""},
                        {"command": "cat filelist.txt", "expected_output": "documents\nnotes.txt\n", "sort": True},
                    ],
                },
            ],
        },
    },
    {
        "dir": "08_pipe_redirect/02_redirect_in",
        "ja_title": "入力リダイレクト",
        "en_title": "Input Redirection",
        "number": "02",
        "learn_ja": """<h2>ファイルから入力を受け取る</h2>
<p><code>&gt;</code> が出力をファイルに送るのに対し、<code>&lt;</code> はファイルの内容をコマンドの<strong>入力</strong>として渡します。</p>

<h2>基本の形</h2>
<pre><code>コマンド &lt; ファイル名</code></pre>
<p>たとえば、次の 2 つは同じ意味です。</p>
<pre><code>grep ERROR app.log
grep ERROR &lt; app.log</code></pre>
<p>2 つ目は <code>app.log</code> の内容が <code>grep</code> に渡されます（この例では grep にファイル名引数がない形）。</p>

<h2>よく使う場面</h2>
<p>パイプ（次のレッスン）と組み合わせる前に、<code>&lt;</code> で「ファイルを入力源にする」イメージを押さえておきましょう。</p>

<h2>次のステップ</h2>
<p>演習ページで <code>grep ERROR &lt; app.log</code> を試してみましょう！</p>""",
        "learn_en": """<h2>Read Input from a File</h2>
<p>While <code>&gt;</code> sends output to a file, <code>&lt;</code> feeds a file's contents as <strong>input</strong> to a command.</p>

<h2>Basic Form</h2>
<pre><code>COMMAND &lt; FILENAME</code></pre>

<h2>Next Step</h2>
<p>Try <code>grep ERROR &lt; app.log</code> on the exercise page!</p>""",
        "exercise_ja": {
            "description": "入力リダイレクトで grep にファイルを渡します。",
            "task": "<p><code>grep ERROR &lt; app.log</code> で、ファイルから ERROR 行を検索しましょう。</p>",
            "instructions": [
                "<code>grep ERROR &lt; app.log</code> を実行します",
                "ERROR 行が表示されることを確認します",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "<code>&lt;</code> はコマンドの後ろ、ファイル名の前に書きます",
                "通常の <code>grep ERROR app.log</code> と結果は同じです",
            ],
        },
        "exercise_en": {
            "description": "Use input redirection with grep.",
            "task": "<p>Run <code>grep ERROR &lt; app.log</code> to search from file input.</p>",
            "instructions": [
                "Run <code>grep ERROR &lt; app.log</code>",
                "Confirm ERROR lines are displayed",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "Put <code>&lt;</code> before the filename",
                "Same result as <code>grep ERROR app.log</code>",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {
                        "app.log": {"type": "file", "content": LOG_CONTENT},
                    },
                }
            },
            "solution": ["grep ERROR < app.log"],
            "cases": [
                {
                    "name_ja": "入力リダイレクトで ERROR 行",
                    "name_en": "ERROR lines via input redirect",
                    "desc_ja": "grep < app.log の出力",
                    "desc_en": "Output of grep < app.log",
                    "type": "command_output",
                    "command": "grep ERROR < app.log",
                    "expected": "2024-01-02 ERROR Connection failed\n2024-01-03 ERROR Disk full\n",
                },
            ],
        },
    },
    {
        "dir": "08_pipe_redirect/03_pipe",
        "ja_title": "パイプ",
        "en_title": "Pipes",
        "number": "03",
        "learn_ja": """<h2>コマンドをつなげる</h2>
<p><strong>パイプ</strong>（<code>|</code>）は、あるコマンドの<strong>出力</strong>を、次のコマンドの<strong>入力</strong>に渡す仕組みです。データがパイプ（管）のように流れるイメージです。</p>

<h2>基本の形</h2>
<pre><code>コマンド1 | コマンド2</code></pre>

<h2>例: ログから ERROR を数える</h2>
<pre><code>$ cat app.log | grep ERROR | wc -l
2</code></pre>
<ol>
  <li><code>cat app.log</code> — ファイル内容を出力</li>
  <li><code>grep ERROR</code> — ERROR 行だけに絞る</li>
  <li><code>wc -l</code> — 行数を数える</li>
</ol>

<h2>中間結果をファイルに保存しなくてよい</h2>
<p>パイプを使えば、一時ファイルを作らずに処理をつなげられます。</p>

<h2>次のステップ</h2>
<p>演習ページでパイプを使ったログ分析を試してみましょう！</p>""",
        "learn_en": """<h2>Connect Commands</h2>
<p>A <strong>pipe</strong> (<code>|</code>) sends one command's <strong>output</strong> as the next command's <strong>input</strong>.</p>

<h2>Example: Count ERROR Lines</h2>
<pre><code>$ cat app.log | grep ERROR | wc -l
2</code></pre>

<h2>Next Step</h2>
<p>Try log analysis with pipes on the exercise page!</p>""",
        "exercise_ja": {
            "description": "パイプで ERROR 行の件数を数えます。",
            "task": "<p><code>cat app.log | grep ERROR | wc -l</code> で ERROR 行が何行あるか数えましょう。</p>",
            "instructions": [
                "<code>cat app.log | grep ERROR</code> で ERROR 行だけ表示します",
                "<code>cat app.log | grep ERROR | wc -l</code> で件数を確認します",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "パイプ <code>|</code> の前後にスペースを入れます",
                "<code>wc -l</code> は行数を数えます",
            ],
        },
        "exercise_en": {
            "description": "Count ERROR lines using pipes.",
            "task": "<p>Run <code>cat app.log | grep ERROR | wc -l</code> to count ERROR lines.</p>",
            "instructions": [
                "Run <code>cat app.log | grep ERROR</code> to filter ERROR lines",
                "Run <code>cat app.log | grep ERROR | wc -l</code> to count them",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "Put spaces around <code>|</code>",
                "<code>wc -l</code> counts lines",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {
                        "app.log": {"type": "file", "content": LOG_CONTENT},
                    },
                }
            },
            "solution": ["cat app.log | grep ERROR | wc -l"],
            "cases": [
                {
                    "name_ja": "ERROR 行が 2 行",
                    "name_en": "Two ERROR lines",
                    "desc_ja": "パイプ + wc -l の結果",
                    "desc_en": "Pipe + wc -l result",
                    "type": "command_output",
                    "command": "cat app.log | grep ERROR | wc -l",
                    "expected": "2\n",
                },
                {
                    "name_ja": "grep までのパイプ",
                    "name_en": "Pipe through grep",
                    "desc_ja": "cat | grep の出力",
                    "desc_en": "cat | grep output",
                    "type": "command_output",
                    "command": "cat app.log | grep ERROR",
                    "expected": "2024-01-02 ERROR Connection failed\n2024-01-03 ERROR Disk full\n",
                },
            ],
        },
    },
    {
        "dir": "08_pipe_redirect/04_combine",
        "ja_title": "組み合わせ演習",
        "en_title": "Combining Commands",
        "number": "04",
        "learn_ja": """<h2>検索・パイプ・リダイレクトを組み合わせる</h2>
<p>第7–8章で学んだ機能を組み合わせると、実践的な作業ができます。</p>

<h2>典型例: 結果をファイルに保存</h2>
<pre><code>$ grep ERROR app.log &gt; errors.txt</code></pre>
<p>ERROR 行だけを <code>errors.txt</code> に書き出します。</p>

<h2>パイプ + リダイレクト</h2>
<pre><code>$ cat app.log | grep ERROR | wc -l &gt; error_count.txt</code></pre>
<p>ERROR 行の件数を数え、その数字をファイルに保存します。</p>

<h2>作業の流れ</h2>
<ol>
  <li>データを読み出す（<code>cat</code> またはファイル指定）</li>
  <li>必要な行に絞る（<code>grep</code>）</li>
  <li>加工する（<code>wc</code> など）</li>
  <li>結果を保存する（<code>&gt;</code>）</li>
</ol>

<h2>次のステップ</h2>
<p>演習ページで組み合わせ課題に挑戦しましょう！</p>""",
        "learn_en": """<h2>Combine Search, Pipes, and Redirection</h2>
<p>Combining Chapter 7–8 features enables practical workflows.</p>

<h2>Save Filtered Results</h2>
<pre><code>$ grep ERROR app.log &gt; errors.txt</code></pre>

<h2>Pipe + Redirect</h2>
<pre><code>$ cat app.log | grep ERROR | wc -l &gt; error_count.txt</code></pre>

<h2>Next Step</h2>
<p>Try the combined exercise!</p>""",
        "exercise_ja": {
            "description": "grep とリダイレクトを組み合わせて ERROR 行を保存します。",
            "task": "<p><code>grep ERROR app.log &gt; errors.txt</code> で ERROR 行をファイルに保存し、内容を確認しましょう。</p>",
            "instructions": [
                "<code>grep ERROR app.log &gt; errors.txt</code> を実行します",
                "<code>cat errors.txt</code> で保存内容を確認します",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "リダイレクト <code>&gt;</code> はコマンド全体の出力先を指定します",
                "<code>cat errors.txt</code> で 2 行表示されれば成功です",
            ],
        },
        "exercise_en": {
            "description": "Combine grep and redirection to save ERROR lines.",
            "task": "<p>Run <code>grep ERROR app.log &gt; errors.txt</code> and verify with <code>cat</code>.</p>",
            "instructions": [
                "Run <code>grep ERROR app.log &gt; errors.txt</code>",
                "Run <code>cat errors.txt</code> to verify",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "<code>&gt;</code> applies to the whole command's output",
                "Two lines in errors.txt means success",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {
                        "app.log": {"type": "file", "content": LOG_CONTENT},
                    },
                }
            },
            "solution": ["grep ERROR app.log > errors.txt"],
            "cases": [
                {
                    "name_ja": "errors.txt に ERROR 行が保存される",
                    "name_en": "ERROR lines saved to errors.txt",
                    "desc_ja": "grep + リダイレクトの結果",
                    "desc_en": "grep + redirect result",
                    "type": "command_sequence",
                    "steps": [
                        {"command": "grep ERROR app.log > errors.txt", "expected_output": ""},
                        {"command": "cat errors.txt", "expected_output": "2024-01-02 ERROR Connection failed\n2024-01-03 ERROR Disk full\n"},
                    ],
                },
            ],
        },
    },
    {
        "dir": "08_pipe_redirect/05_review",
        "ja_title": "検索・パイプの総復習",
        "en_title": "Search and Pipes Review",
        "number": "05",
        "learn_ja": """<h2>第7–8章のまとめ</h2>
<p>検索とデータの流れを制御するコマンドを振り返りましょう。</p>

<h3>第7章 — 検索</h3>
<table>
  <tr><th>コマンド</th><th>意味</th></tr>
  <tr><td><code>grep パターン ファイル</code></td><td>テキストの中から行を検索</td></tr>
  <tr><td><code>grep -i/-n/-v/-c</code></td><td>大文字小文字無視・行番号・反転・件数</td></tr>
  <tr><td><code>find  dir -name パターン</code></td><td>ファイル名で再帰検索</td></tr>
  <tr><td><code>ls *.txt</code></td><td>ワイルドカードでファイル名を指定</td></tr>
</table>

<h3>第8章 — パイプとリダイレクト</h3>
<table>
  <tr><th>記号</th><th>意味</th></tr>
  <tr><td><code>&gt;</code></td><td>出力をファイルに書き込む（上書き）</td></tr>
  <tr><td><code>&gt;&gt;</code></td><td>出力をファイルに追記</td></tr>
  <tr><td><code>&lt;</code></td><td>ファイルを入力として渡す</td></tr>
  <tr><td><code>|</code></td><td>コマンドの出力を次のコマンドへ</td></tr>
</table>

<h2>次のステップ</h2>
<p>演習ページで総合課題に挑戦しましょう！</p>""",
        "learn_en": """<h2>Chapters 7–8 Summary</h2>
<p>Review search and data-flow commands.</p>

<h3>Chapter 7 — Search</h3>
<table>
  <tr><th>Command</th><th>Meaning</th></tr>
  <tr><td><code>grep PATTERN FILE</code></td><td>Search lines in text</td></tr>
  <tr><td><code>find dir -name PATTERN</code></td><td>Recursive filename search</td></tr>
  <tr><td><code>ls *.txt</code></td><td>Wildcard filename matching</td></tr>
</table>

<h3>Chapter 8 — Pipes and Redirection</h3>
<table>
  <tr><th>Symbol</th><th>Meaning</th></tr>
  <tr><td><code>&gt;</code></td><td>Write output to file (overwrite)</td></tr>
  <tr><td><code>&gt;&gt;</code></td><td>Append output to file</td></tr>
  <tr><td><code>&lt;</code></td><td>Use file as input</td></tr>
  <tr><td><code>|</code></td><td>Pipe output to next command</td></tr>
</table>

<h2>Next Step</h2>
<p>Try the combined review exercise!</p>""",
        "exercise_ja": {
            "description": "grep・パイプ・リダイレクトの総合課題です。",
            "task": "<p>ログから ERROR 行を抽出し件数をファイルに保存する一連の操作を行いましょう。</p>",
            "instructions": [
                "<code>cat app.log | grep ERROR | wc -l &gt; error_count.txt</code> を実行します",
                "<code>cat error_count.txt</code> で件数（2）を確認します",
                "<code>grep ERROR app.log &gt; errors.txt</code> も実行して ERROR 行を保存します",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "パイプとリダイレクトは組み合わせて使えます",
                "最後に <code>cat</code> で結果ファイルを確認しましょう",
            ],
        },
        "exercise_en": {
            "description": "Combined exercise for grep, pipes, and redirection.",
            "task": "<p>Extract ERROR lines from a log and save the count to a file.</p>",
            "instructions": [
                "Run <code>cat app.log | grep ERROR | wc -l &gt; error_count.txt</code>",
                "Run <code>cat error_count.txt</code> to verify the count (2)",
                "Run <code>grep ERROR app.log &gt; errors.txt</code> to save ERROR lines",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "Pipes and redirection can be combined",
                "Use <code>cat</code> to verify result files",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {
                        "app.log": {"type": "file", "content": LOG_CONTENT},
                    },
                }
            },
            "solution": [
                "cat app.log | grep ERROR | wc -l > error_count.txt",
                "grep ERROR app.log > errors.txt",
            ],
            "cases": [
                {
                    "name_ja": "error_count.txt に件数 2",
                    "name_en": "error_count.txt contains 2",
                    "desc_ja": "パイプ + リダイレクトの件数",
                    "desc_en": "Count via pipe + redirect",
                    "type": "command_sequence",
                    "steps": [
                        {"command": "cat app.log | grep ERROR | wc -l > error_count.txt", "expected_output": ""},
                        {"command": "cat error_count.txt", "expected_output": "2\n"},
                    ],
                },
                {
                    "name_ja": "errors.txt に ERROR 行",
                    "name_en": "ERROR lines in errors.txt",
                    "desc_ja": "grep + リダイレクト",
                    "desc_en": "grep + redirect",
                    "type": "command_sequence",
                    "steps": [
                        {"command": "grep ERROR app.log > errors.txt", "expected_output": ""},
                        {"command": "cat errors.txt", "expected_output": "2024-01-02 ERROR Connection failed\n2024-01-03 ERROR Disk full\n"},
                    ],
                },
            ],
        },
    },
    {
        "dir": "09_shell_basics/01_history",
        "ja_title": "コマンド履歴",
        "en_title": "Command History",
        "number": "01",
        "learn_ja": """<h2>打ったコマンドを呼び出す</h2>
<p>第1章でターミナルを触り始めたとき、<kbd>↑</kbd>（上矢印）キーで以前のコマンドが出てくることを体験したかもしれません。ここでは<strong>コマンド履歴</strong>を正式に学びます。</p>

<h2>履歴とは</h2>
<p>シェルは、Enter で実行したコマンドを<strong>履歴</strong>として記録します。長いコマンドを毎回打ち直す必要がなくなります。</p>

<h2>↑ と ↓ キー</h2>
<ul>
  <li><kbd>↑</kbd> — 1 つ前のコマンドを表示（さらに押すとさらに古いコマンド）</li>
  <li><kbd>↓</kbd> — 1 つ新しいコマンドへ（↑ で戻ったあとに使う）</li>
</ul>

<h2>活用のコツ</h2>
<ul>
  <li>同じコマンドを何度も実行するときは ↑ で呼び出して Enter</li>
  <li>少しだけ変えたいときは ↑ で呼び出してから編集</li>
</ul>

<h2>この道場のターミナル</h2>
<p>IZM Linux Dojo の演習ターミナルでも ↑↓ キーが使えます。演習ページで試してみましょう。</p>

<h2>次のステップ</h2>
<p>演習では、いくつかコマンドを実行したあと ↑ キーで履歴を呼び出してみましょう！</p>""",
        "learn_en": """<h2>Recall Commands You Typed</h2>
<p>In Chapter 1 you may have noticed that the <kbd>↑</kbd> key brings back previous commands. Here we formally cover <strong>command history</strong>.</p>

<h2>What Is History?</h2>
<p>The shell records commands you run. You do not need to retype long commands every time.</p>

<h2>↑ and ↓ Keys</h2>
<ul>
  <li><kbd>↑</kbd> — show the previous command (press again for older ones)</li>
  <li><kbd>↓</kbd> — move toward newer commands</li>
</ul>

<h2>Tips</h2>
<ul>
  <li>Press ↑ and Enter to rerun the same command</li>
  <li>Press ↑, edit slightly, then Enter for a small change</li>
</ul>

<h2>Next Step</h2>
<p>On the exercise page, run a few commands and try recalling them with ↑!</p>""",
        "exercise_ja": {
            "description": "コマンド履歴の使い方を確認します（↑↓ キー）。",
            "task": "<p>いくつかコマンドを実行し、<kbd>↑</kbd> キーで履歴から呼び出して再実行してみましょう。テストでは <code>pwd</code> と <code>ls</code> が正しく動くことを確認します。</p>",
            "instructions": [
                "<code>pwd</code> を実行します",
                "<code>ls</code> を実行します",
                "<kbd>↑</kbd> キーを押して <code>ls</code> を呼び出し、Enter で再実行します",
                "履歴の便利さを体感できたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "↑ を複数回押すと、さらに古いコマンドが出てきます",
                "履歴は Enter で実行したコマンドだけが記録されます",
            ],
        },
        "exercise_en": {
            "description": "Practice command history with ↑↓ keys.",
            "task": "<p>Run a few commands, recall them with <kbd>↑</kbd>, and rerun. Tests verify <code>pwd</code> and <code>ls</code> work correctly.</p>",
            "instructions": [
                "Run <code>pwd</code>",
                "Run <code>ls</code>",
                "Press <kbd>↑</kbd> to recall <code>ls</code> and press Enter to rerun",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "Press ↑ multiple times for older commands",
                "Only commands executed with Enter are recorded",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {
                        "notes.txt": {"type": "file", "content": "memo\n"},
                        "work": {"type": "directory", "children": {}},
                    },
                }
            },
            "solution": ["pwd", "ls"],
            "cases": [
                {
                    "name_ja": "pwd が正しい",
                    "name_en": "pwd is correct",
                    "desc_ja": "現在地の確認",
                    "desc_en": "Verify current directory",
                    "type": "command_output",
                    "command": "pwd",
                    "expected": "/home/user\n",
                },
                {
                    "name_ja": "ls が動作する",
                    "name_en": "ls works",
                    "desc_ja": "ファイル一覧",
                    "desc_en": "File listing",
                    "type": "command_output",
                    "command": "ls",
                    "expected": "notes.txt\nwork\n",
                    "sort": True,
                },
            ],
        },
    },
    {
        "dir": "09_shell_basics/02_tab_complete",
        "ja_title": "Tab 補完",
        "en_title": "Tab Completion",
        "number": "02",
        "learn_ja": """<h2>入力を補完する</h2>
<p>第1章でも触れた <strong>Tab 補完</strong>を、ここで正式に学びます。Tab キーを押すと、シェルがコマンド名やパスを<strong>自動で補完</strong>してくれます。</p>

<h2>コマンド名の補完</h2>
<p>コマンドの最初の数文字を入力して Tab を押すと、候補が一意なら自動で補完されます。</p>
<pre><code>$ gr[Tab]  →  grep （候補が grep だけなら）</code></pre>

<h2>パスの補完</h2>
<p>ディレクトリ名やファイル名も Tab で補完できます。</p>
<pre><code>$ cd doc[Tab]  →  cd documents/</code></pre>
<p>ディレクトリの場合、末尾に <code>/</code> が付くことがあります。</p>

<h2>候補が複数あるとき</h2>
<p>Tab を 2 回押すと、可能な候補の一覧が表示されることがあります。</p>

<h2>次のステップ</h2>
<p>演習ページで Tab を使って <code>documents</code> ディレクトリに移動してみましょう！</p>""",
        "learn_en": """<h2>Complete What You Type</h2>
<p><strong>Tab completion</strong> lets the shell auto-complete command names and paths.</p>

<h2>Complete Command Names</h2>
<pre><code>$ gr[Tab]  →  grep</code></pre>

<h2>Complete Paths</h2>
<pre><code>$ cd doc[Tab]  →  cd documents/</code></pre>

<h2>Next Step</h2>
<p>On the exercise page, use Tab to cd into <code>documents</code>!</p>""",
        "exercise_ja": {
            "description": "Tab 補完を使ってディレクトリに移動します。",
            "task": "<p><code>cd documents</code> で documents ディレクトリに移動し、Tab 補完も試してみましょう（<code>cd doc</code> + Tab など）。</p>",
            "instructions": [
                "<code>ls</code> で <code>documents</code> があることを確認します",
                "<code>cd documents</code> で移動します（Tab 補完も試して OK）",
                "<code>ls</code> で中身を確認します",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "<code>cd doc</code> と入力して Tab を押すと documents に補完される場合があります",
                "Tab は入力の途中どこでも押せます",
            ],
        },
        "exercise_en": {
            "description": "Use Tab completion to navigate directories.",
            "task": "<p>Move to <code>documents</code> with <code>cd documents</code> and try Tab completion (<code>cd doc</code> + Tab).</p>",
            "instructions": [
                "Run <code>ls</code> to confirm <code>documents</code> exists",
                "Run <code>cd documents</code> (Tab completion is fine too)",
                "Run <code>ls</code> to see contents",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "Try <code>cd doc</code> then Tab",
                "Tab works anywhere in your input",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {
                        "documents": {
                            "type": "directory",
                            "children": {
                                "readme.txt": {"type": "file", "content": "hello\n"},
                            },
                        },
                        "notes.txt": {"type": "file", "content": "memo\n"},
                    },
                }
            },
            "solution": ["cd documents", "ls"],
            "cases": [
                {
                    "name_ja": "documents に移動",
                    "name_en": "Moved to documents",
                    "desc_ja": "cd documents 後の cwd",
                    "desc_en": "cwd after cd documents",
                    "type": "cwd",
                    "commands": ["cd documents"],
                    "expected_cwd": "/home/user/documents",
                },
                {
                    "name_ja": "readme.txt が表示される",
                    "name_en": "readme.txt is listed",
                    "desc_ja": "documents 内の ls",
                    "desc_en": "ls inside documents",
                    "type": "command_sequence",
                    "steps": [
                        {"command": "cd documents", "expected_cwd": "/home/user/documents"},
                        {"command": "ls", "expected_output": "readme.txt\n"},
                    ],
                },
            ],
        },
    },
    {
        "dir": "09_shell_basics/03_man_help",
        "ja_title": "ヘルプの調べ方",
        "en_title": "Getting Help",
        "number": "03",
        "learn_ja": """<h2>困ったときは自分で調べる</h2>
<p>Linux にはたくさんのコマンドがあり、すべてを暗記する必要はありません。使い方が分からなくなったら、<strong>ヘルプ</strong>を調べる習慣をつけましょう。</p>

<h2><code>--help</code> オプション</h2>
<p>多くのコマンドは <code>--help</code> で簡単な説明を表示します。</p>
<pre><code>$ ls --help
Usage: ls [OPTION]... [FILE]...
List directory contents.
...</code></pre>

<h2><code>man</code> コマンド</h2>
<p><code>man</code>（manual）は、コマンドの<strong>マニュアルページ</strong>を表示します。本物の Linux では詳しい説明が読めます。</p>
<pre><code>$ man ls</code></pre>
<p>この道場のシミュレータでも、主要コマンドの man ページを読めます。</p>

<h2>覚えておくこと</h2>
<ul>
  <li>まず <code>コマンド --help</code> を試す</li>
  <li>もっと詳しく知りたいときは <code>man コマンド</code></li>
</ul>

<h2>次のステップ</h2>
<p>演習ページで <code>ls --help</code> や <code>man grep</code> を試してみましょう！</p>""",
        "learn_en": """<h2>Look It Up Yourself</h2>
<p>You do not need to memorize every Linux command. When stuck, check the <strong>help</strong>.</p>

<h2><code>--help</code> Option</h2>
<pre><code>$ ls --help</code></pre>

<h2><code>man</code> Command</h2>
<pre><code>$ man ls</code></pre>
<p>The dojo simulator includes manual pages for major commands.</p>

<h2>Next Step</h2>
<p>Try <code>ls --help</code> and <code>man grep</code> on the exercise page!</p>""",
        "exercise_ja": {
            "description": "--help と man でコマンドの使い方を調べます。",
            "task": "<p><code>ls --help</code> で ls のヘルプを表示し、<code>grep --help</code> も試してみましょう。</p>",
            "instructions": [
                "<code>ls --help</code> を実行してオプション一覧を確認します",
                "<code>grep --help</code> も実行してみます",
                "<code>man ls</code> でマニュアルページも読めます（任意）",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "<code>--help</code> はハイフン 2 つです",
                "ヘルプは画面いっぱいに表示されることがあります",
            ],
        },
        "exercise_en": {
            "description": "Look up command usage with --help and man.",
            "task": "<p>Run <code>ls --help</code> and try <code>grep --help</code> too.</p>",
            "instructions": [
                "Run <code>ls --help</code> to see options",
                "Run <code>grep --help</code> as well",
                "Optionally try <code>man ls</code>",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "<code>--help</code> uses two hyphens",
                "Help text may fill the screen",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {},
                }
            },
            "solution": ["ls --help", "grep --help"],
            "cases": [
                {
                    "name_ja": "ls --help が表示される",
                    "name_en": "ls --help works",
                    "desc_ja": "ls ヘルプの先頭行",
                    "desc_en": "First line of ls help",
                    "type": "command_output",
                    "command": "ls --help",
                    "expected": "Usage: ls [OPTION]... [FILE]...\n",
                    "prefix": True,
                },
                {
                    "name_ja": "grep --help が表示される",
                    "name_en": "grep --help works",
                    "desc_ja": "grep ヘルプの先頭行",
                    "desc_en": "First line of grep help",
                    "type": "command_output",
                    "command": "grep --help",
                    "expected": "Usage: grep [OPTION]... PATTERN [FILE]...\n",
                    "prefix": True,
                },
            ],
        },
    },
    {
        "dir": "09_shell_basics/04_env",
        "ja_title": "環境変数",
        "en_title": "Environment Variables",
        "number": "04",
        "learn_ja": """<h2>シェルが覚えている値</h2>
<p><strong>環境変数</strong>は、シェルやプログラムが参照できる「名前付きの値」です。たとえば、ホームディレクトリの場所やユーザー名が環境変数として保持されています。</p>

<h2><code>echo</code> で表示</h2>
<p><code>echo</code> は文字列を表示するコマンドです。環境変数は <code>$</code> を付けて参照します。</p>
<pre><code>$ echo $HOME
/home/user

$ echo $USER
user</code></pre>

<h2>主な環境変数</h2>
<table>
  <tr><th>変数</th><th>意味</th></tr>
  <tr><td><code>$HOME</code></td><td>ホームディレクトリのパス</td></tr>
  <tr><td><code>$USER</code></td><td>ログイン中のユーザー名</td></tr>
  <tr><td><code>$PATH</code></td><td>コマンドを探すディレクトリの一覧</td></tr>
</table>

<h2>なぜ知っておくか</h2>
<p>スクリプトや設定ファイルで <code>$HOME</code> が使われることがあります。「自分のホームはどこか」を環境変数で確認できます。</p>

<h2>次のステップ</h2>
<p>演習ページで <code>echo $HOME</code> と <code>echo $USER</code> を試してみましょう！</p>""",
        "learn_en": """<h2>Values the Shell Remembers</h2>
<p><strong>Environment variables</strong> are named values that the shell and programs can read.</p>

<h2>Display with <code>echo</code></h2>
<pre><code>$ echo $HOME
/home/user

$ echo $USER
user</code></pre>

<h2>Common Variables</h2>
<table>
  <tr><th>Variable</th><th>Meaning</th></tr>
  <tr><td><code>$HOME</code></td><td>Home directory path</td></tr>
  <tr><td><code>$USER</code></td><td>Current username</td></tr>
  <tr><td><code>$PATH</code></td><td>Directories searched for commands</td></tr>
</table>

<h2>Next Step</h2>
<p>Try <code>echo $HOME</code> and <code>echo $USER</code> on the exercise page!</p>""",
        "exercise_ja": {
            "description": "echo で環境変数 HOME と USER を表示します。",
            "task": "<p><code>echo $HOME</code> と <code>echo $USER</code> を実行して、値を確認しましょう。</p>",
            "instructions": [
                "<code>echo $HOME</code> を実行します（/home/user と表示されるはず）",
                "<code>echo $USER</code> を実行します（user と表示されるはず）",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "変数名の前に <code>$</code> を付けます",
                "<code>echo $PATH</code> も試してみましょう（任意）",
            ],
        },
        "exercise_en": {
            "description": "Display HOME and USER environment variables with echo.",
            "task": "<p>Run <code>echo $HOME</code> and <code>echo $USER</code> to see their values.</p>",
            "instructions": [
                "Run <code>echo $HOME</code> (should show /home/user)",
                "Run <code>echo $USER</code> (should show user)",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "Use <code>$</code> before the variable name",
                "Optionally try <code>echo $PATH</code>",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {},
                }
            },
            "solution": ["echo $HOME", "echo $USER"],
            "cases": [
                {
                    "name_ja": "HOME が表示される",
                    "name_en": "HOME is displayed",
                    "desc_ja": "echo $HOME の出力",
                    "desc_en": "echo $HOME output",
                    "type": "command_output",
                    "command": "echo $HOME",
                    "expected": "/home/user\n",
                },
                {
                    "name_ja": "USER が表示される",
                    "name_en": "USER is displayed",
                    "desc_ja": "echo $USER の出力",
                    "desc_en": "echo $USER output",
                    "type": "command_output",
                    "command": "echo $USER",
                    "expected": "user\n",
                },
            ],
        },
    },
    {
        "dir": "09_shell_basics/05_multi_command",
        "ja_title": "コマンド連結",
        "en_title": "Chaining Commands",
        "number": "05",
        "learn_ja": """<h2>1 行に複数コマンド</h2>
<p>シェルでは、1 行に複数のコマンドを書いて順番に実行できます。</p>

<h2><code>;</code> — 順番に実行</h2>
<pre><code>$ cd documents; ls</code></pre>
<p>左のコマンドの<strong>成否に関係なく</strong>、右も実行されます。</p>

<h2><code>&amp;&amp;</code> — 成功したら次を実行</h2>
<pre><code>$ cd documents &amp;&amp; ls</code></pre>
<p>左のコマンドが<strong>成功（終了コード 0）</strong>したときだけ、右を実行します。<code>cd</code> が失敗したら <code>ls</code> は実行されません。</p>

<h2>使い分け</h2>
<ul>
  <li><code>;</code> — 独立した操作を続けて実行</li>
  <li><code>&amp;&amp;</code> — 前が成功したときだけ次へ（安全な連鎖）</li>
</ul>

<h2>次のステップ</h2>
<p>演習ページで <code>cd documents &amp;&amp; ls</code> を試してみましょう！</p>""",
        "learn_en": """<h2>Multiple Commands on One Line</h2>
<p>The shell can run several commands in sequence on one line.</p>

<h2><code>;</code> — Run in Order</h2>
<pre><code>$ cd documents; ls</code></pre>
<p>The right command runs <strong>regardless</strong> of whether the left one succeeded.</p>

<h2><code>&amp;&amp;</code> — Run If Previous Succeeded</h2>
<pre><code>$ cd documents &amp;&amp; ls</code></pre>
<p>The right command runs only if the left one <strong>succeeded (exit code 0)</strong>.</p>

<h2>Next Step</h2>
<p>Try <code>cd documents &amp;&amp; ls</code> on the exercise page!</p>""",
        "exercise_ja": {
            "description": "&& で cd と ls を1行で実行します。",
            "task": "<p><code>cd documents &amp;&amp; ls</code> で documents に移動してから一覧表示しましょう。</p>",
            "instructions": [
                "<code>ls</code> で documents があることを確認します",
                "<code>cd documents &amp;&amp; ls</code> を実行します",
                "<code>readme.txt</code> が表示されることを確認します",
                "準備ができたら <strong>テスト</strong> ボタンをクリックしてください",
            ],
            "hints": [
                "<code>&amp;&amp;</code> の前後にスペースを入れます",
                "cd が失敗すると ls は実行されません",
            ],
        },
        "exercise_en": {
            "description": "Chain cd and ls with && on one line.",
            "task": "<p>Run <code>cd documents &amp;&amp; ls</code> to move and list in one line.</p>",
            "instructions": [
                "Run <code>ls</code> to confirm documents exists",
                "Run <code>cd documents &amp;&amp; ls</code>",
                "Confirm readme.txt is displayed",
                "Click the <strong>Test</strong> button when ready",
            ],
            "hints": [
                "Put spaces around <code>&amp;&amp;</code>",
                "If cd fails, ls will not run",
            ],
        },
        "tests": {
            "filesystem": {
                "/home/user": {
                    "type": "directory",
                    "children": {
                        "documents": {
                            "type": "directory",
                            "children": {
                                "readme.txt": {"type": "file", "content": "hello\n"},
                            },
                        },
                    },
                }
            },
            "solution": ["cd documents && ls"],
            "cases": [
                {
                    "name_ja": "cd && ls が動作する",
                    "name_en": "cd && ls works",
                    "desc_ja": "連結コマンドの結果",
                    "desc_en": "Chained command result",
                    "type": "command_sequence",
                    "steps": [
                        {"command": "cd documents && ls", "expected_output": "readme.txt\n", "expected_cwd": "/home/user/documents"},
                    ],
                },
                {
                    "name_ja": "セミコロン連結も動作",
                    "name_en": "Semicolon chaining works",
                    "desc_ja": "pwd; ls の実行",
                    "desc_en": "pwd; ls execution",
                    "type": "command_output",
                    "command": "pwd; ls",
                    "expected": "/home/user\n",
                    "prefix": True,
                },
            ],
        },
    },
]

ALL_LESSONS = LESSONS + CHAPTER_08_09


def chapter_meta(dir_path):
    chapter = dir_path.split("/")[0]
    mapping = {
        "07_search": ("07", "07_search"),
        "08_pipe_redirect": ("08", "08_pipe_redirect"),
        "09_shell_basics": ("09", "09_shell_basics"),
    }
    num, ch = mapping[chapter]
    return num, ch


def yaml_quote(s):
    if "\n" in s:
        return "|\n" + "\n".join("  " + line for line in s.split("\n")) + "\n"
    return json_escape(s)


def json_escape(s):
    import json
    return json.dumps(s, ensure_ascii=False)


def write_learn(path, lesson, lang):
    num, ch = chapter_meta(lesson["dir"])
    title = lesson["ja_title"] if lang == "ja" else lesson["en_title"]
    content = lesson["learn_ja"] if lang == "ja" else lesson["learn_en"]
    text = f"""lesson:
  chapter: "{ch}"
  chapter_number: "{num}"
  number: "{lesson['number']}"
  id: "{lesson['dir']}"
  title: {json_escape(title)}

content: |
{chr(10).join('  ' + line for line in content.split(chr(10)))}
"""
    (path / f"learn.{lang}.yaml").write_text(text, encoding="utf-8")


def write_exercise(path, lesson, lang):
    num, ch = chapter_meta(lesson["dir"])
    title = lesson["ja_title"] if lang == "ja" else lesson["en_title"]
    ex = lesson["exercise_ja"] if lang == "ja" else lesson["exercise_en"]
    instr = "\n".join(f'  - {json_escape(i)}' for i in ex["instructions"])
    hints = "\n".join(f'  - {json_escape(h)}' for h in ex["hints"])
    task_lines = "\n".join("  " + line for line in ex["task"].split("\n"))
    text = f"""lesson:
  chapter: "{ch}"
  chapter_number: "{num}"
  number: "{lesson['number']}"
  id: "{lesson['dir']}"
  title: {json_escape(title)}

description: {json_escape(ex['description'])}

task_description: |
{task_lines}

instructions:
{instr}

hints:
{hints}
"""
    (path / f"exercise.{lang}.yaml").write_text(text, encoding="utf-8")


def format_test_case(case, lang):
    name = case["name_ja"] if lang == "ja" else case["name_en"]
    desc = case["desc_ja"] if lang == "ja" else case["desc_en"]
    t = case["type"]
    lines = [
        f'  - name: {json_escape(name)}',
        f'    description: {json_escape(desc)}',
        f'    type: {t}',
    ]
    if t == "command_output":
        lines.append(f'    command: {json_escape(case["command"])}')
        exp = case["expected"]
        if case.get("prefix"):
            # prefix match via expected first line only - tester does exact match
            lines.append(f'    expected_output: {json_escape(exp)}')
        else:
            lines.append("    expected_output: |")
            for line in exp.rstrip("\n").split("\n"):
                lines.append(f"      {line}")
    elif t == "cwd":
        cmds = case.get("commands", [])
        lines.append("    commands: []" if not cmds else "    commands:")
        for c in cmds:
            lines.append(f"      - {json_escape(c)}")
        lines.append(f'    expected_cwd: {json_escape(case["expected_cwd"])}')
    elif t == "command_sequence":
        lines.append("    steps:")
        for step in case["steps"]:
            lines.append(f'      - command: {json_escape(step["command"])}')
            if "expected_output" in step:
                if step["expected_output"] == "":
                    lines.append('        expected_output: ""')
                else:
                    lines.append("        expected_output: |")
                    for line in step["expected_output"].rstrip("\n").split("\n"):
                        lines.append(f"          {line}")
            if "expected_cwd" in step:
                lines.append(f'        expected_cwd: {json_escape(step["expected_cwd"])}')
    return "\n".join(lines)


def write_tests(path, lesson, lang):
    import yaml as pyyaml
    fs = lesson["tests"]["filesystem"]
    fs_yaml = pyyaml.dump({"initial_filesystem": fs}, allow_unicode=True, default_flow_style=False, sort_keys=False)
    # strip first line key and re-indent
    fs_body = fs_yaml.split("initial_filesystem:", 1)[1].rstrip()
    sol = lesson["tests"]["solution"]
    sol_lines = "\n".join(f"  - {json_escape(c)}" for c in sol)
    cases = "\n".join(format_test_case(c, lang) for c in lesson["tests"]["cases"])
    text = f"""initial_filesystem:{fs_body}

initial_cwd: /home/user

solution_commands:
{sol_lines}

tests:
{cases}
"""
    (path / f"tests.{lang}.yaml").write_text(text, encoding="utf-8")


def main():
    import json  # noqa: F401 — used via json_escape
    for lesson in ALL_LESSONS:
        path = ROOT / lesson["dir"]
        path.mkdir(parents=True, exist_ok=True)
        for lang in ("ja", "en"):
            write_learn(path, lesson, lang)
            write_exercise(path, lesson, lang)
            write_tests(path, lesson, lang)
        print(f"Created {lesson['dir']}")


if __name__ == "__main__":
    main()
