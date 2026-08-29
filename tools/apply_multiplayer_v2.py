from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / 'belote_offline_single.html'
DESIGN = ROOT / 'tests' / 'design-agent.spec.mjs'
RULES = ROOT / 'tests' / 'rules-agent.spec.mjs'
PACKAGE = ROOT / 'package.json'


def need_replace(text, old, new, label):
    if old not in text:
        raise RuntimeError(f'missing anchor: {label}')
    return text.replace(old, new, 1)


def need_sub(text, pattern, replacement, label, flags=0):
    out, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if not count:
        raise RuntimeError(f'missing regex anchor: {label}')
    return out


html = HTML.read_text(encoding='utf-8')
if 'belote_multiplayer.js' not in html:
    html = need_replace(
        html,
        '<meta name="theme-color" content="#10261b"><title>Belote - Offline</title>',
        '<meta name="theme-color" content="#10261b"><meta name="belote-signaling-url" content=""><title>Belote</title>',
        'head meta',
    )

    html = need_sub(html, r'<button class="menu-btn" data-action="new-local">.*?</button>', '', 'local menu button', re.S)
    html = need_sub(html, r'<label><span id="modeLabel">.*?<select id="mode">.*?</select></label>', '', 'local mode select', re.S)

    for old, new in {
        'Klasyczna gra lewowa dla czterech osób. Zagraj z botami albo podaj urządzenie dalej.': 'Klasyczna gra lewowa dla czterech osób. Zagraj solo z botami albo zaproś znajomych do prywatnego pokoju online.',
        'A classic four-player trick-taking game. Play with bots or pass the device around.': 'A classic four-player trick-taking game. Play solo with bots or invite friends to a private online room.',
        'Ein klassisches Stichspiel für vier Personen. Spiele mit Bots oder gib das Gerät weiter.': 'Ein klassisches Stichspiel für vier Personen. Spiele solo mit Bots oder lade Freunde in einen privaten Online-Raum ein.',
        "local:'4 graczy lokalnie',": '',
        "local:'4 players local',": '',
        "local:'4 Spieler lokal',": '',
        "localOpt:'4 graczy lokalnie',": '',
        "localOpt:'4 players local',": '',
        "localOpt:'4 Spieler lokal',": '',
    }.items():
        html = html.replace(old, new)

    html = need_replace(html, "function canHuman(p){return state.mode==='local'||p===0}", "function canHuman(p){return p===0}", 'human seat')

    old_bot = "async function nextBot(){if(!state||state.phase==='done'||canHuman(state.active)||state.multiplayer)return;let token=++state.botTimer,delay=state.phase==='bid'?(state.diff==='calm'?1350:1050):(state.diff==='calm'?950:680);await sleep(delay);if(!state||token!==state.botTimer||canHuman(state.active)||state.multiplayer)return;let p=state.active;if(state.phase==='bid'){let s=botSuit(p);bid(p,s||'pass')}else if(state.phase==='play'){let l=legal(p);let choice=l.sort((a,b)=>points(a,state.trump)-points(b,state.trump)||strength(a,state.trump)-strength(b,state.trump))[0];play(p,choice.id)}}"
    new_bot = "function isBotControlled(p){if(!Number.isInteger(p))return false;let runtime=window.BeloteMultiplayerRuntime;if(state?.multiplayer)return !!runtime?.isBotControlled?.(p);return p!==0}\nasync function nextBot(){if(!state||state.phase==='done'||!isBotControlled(state.active))return;let token=++state.botTimer,delay=state.phase==='bid'?(state.diff==='calm'?1350:1050):(state.diff==='calm'?950:680);await sleep(window.__BELOTE_TEST_FAST__?Math.min(delay,2):delay);if(!state||token!==state.botTimer||!isBotControlled(state.active))return;let p=state.active;if(state.phase==='bid'){let s=botSuit(p);bid(p,s||'pass')}else if(state.phase==='play'){let l=legal(p);let choice=l.sort((a,b)=>points(a,state.trump)-points(b,state.trump)||strength(a,state.trump)-strength(b,state.trump))[0];if(choice)play(p,choice.id)}}"
    html = need_replace(html, old_bot, new_bot, 'bot authority')

    old_persist = "function persist(){try{if(!state?.multiplayer)localStorage.setItem('beloteState',JSON.stringify(state));localStorage.setItem('belotePrefs',JSON.stringify(prefs))}catch(_){}}"
    new_persist = "function persist(){try{if(!state?.multiplayer)localStorage.setItem('beloteState',JSON.stringify(state));else window.BeloteMultiplayerRuntime?.stateChanged?.();localStorage.setItem('belotePrefs',JSON.stringify(prefs))}catch(_){}}"
    html = need_replace(html, old_persist, new_persist, 'persistence hook')

    html = html.replace("$('#localMenu').textContent=tr('local');", '')
    html = html.replace("$('#modeLabel').textContent=tr('mode');", '')
    html = html.replace("$('#mode').options[0].text=tr('botsOpt');$('#mode').options[1].text=tr('localOpt');", '')
    html = need_sub(html, r"function openNew\(mode\)\{\$\('#mode'\)\.value=mode\|\|'bots';", 'function openNew(){', 'new dialog')
    html = html.replace("else if(a==='new')openNew();else if(a==='new-bots')openNew('bots');else if(a==='new-local')openNew('local');", "else if(a==='new')openNew();else if(a==='new-bots')openNew();")
    html = html.replace("openNew('bots')", "openNew()")
    html = need_replace(html, "state=fresh($('#mode').value,Number($('#goal').value),$('#difficulty').value,$('#playerName').value.trim()||'Ty');", "state=fresh('bots',Number($('#goal').value),$('#difficulty').value,$('#playerName').value.trim()||'Ty');", 'single player start')
    html = html.replace('setInterval(mpTick,180);', '/* legacy manual signaling disabled by multiplayer v2 */')
    html = html.replace("state=saved;state.v=2;", "state=saved;state.v=2;if(state.mode==='local')state.mode='bots';")

    bridge = """\nwindow.BeloteNetworkBridge={\n prefs,\n getState:()=>state,\n setState:value=>{state=value;return state},\n fresh,deal,render,legal,bidSuits,bid,play,persist,nextBot,\n toast,tr:tr,\n syncResultModal:()=>{if(!state)return;if(state.phase==='done'){$('#resultModal').classList.remove('hidden');$('#resultScore').textContent=`${state.raw[0]} - ${state.raw[1]}`;let winner=state.scores[0]>=state.goal?0:state.scores[1]>=state.goal?1:null;$('#resultCopy').textContent=winner===null?state.result:`${winner===0?tr('team0'):tr('team1')} ${tr('gameWon')}`;$('#nextHand').textContent=winner===null?tr('next'):tr('new')}else $('#resultModal').classList.add('hidden')}\n};\n"""
    marker = "let needsRedeal=false;"
    if marker not in html:
        raise RuntimeError('missing bridge insertion anchor')
    html = html.replace(marker, bridge + marker, 1)
    html = need_replace(html, '</script></body></html>', '</script><script src="belote_multiplayer.js"></script></body></html>', 'client include')
    HTML.write_text(html, encoding='utf-8')


design = DESIGN.read_text(encoding='utf-8')
design = design.replace("mode: 'local'", "mode: 'bots'")
design = design.replace("['#mainMenu .menu-title', '#botsMenu', '#localMenu', '#learnMenu', '#language']", "['#mainMenu .menu-title', '#botsMenu', '#shareMenu', '#learnMenu', '#language']")
design = design.replace("['#multiplayerTitle', '#mpCreateButton', '#mpOfferButton']", "['#multiplayerTitle', '#mpCreateButton', '#mpJoinButton']")
DESIGN.write_text(design, encoding='utf-8')

rules = RULES.read_text(encoding='utf-8').replace("Q.fresh('local'", "Q.fresh('bots'")
RULES.write_text(rules, encoding='utf-8')

package = json.loads(PACKAGE.read_text(encoding='utf-8'))
package.setdefault('scripts', {})['test:multiplayer'] = 'playwright test tests/multiplayer-regression.spec.mjs --project=chromium'
PACKAGE.write_text(json.dumps(package, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
