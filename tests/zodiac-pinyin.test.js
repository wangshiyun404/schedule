const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const html=fs.readFileSync('public/ai-works/zodiac-explorer/game.html','utf8');
const runtime=fs.readFileSync('public/ai-works/zodiac-explorer/pinyin.js','utf8');
test('zodiac scripts remain valid JavaScript',()=>{for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);new vm.Script(runtime);});
test('offline pinyin dictionary aligns characters and handles key polyphones',()=>{const dict=JSON.parse(runtime.match(/const readings=(\{[^\n]+\});/)[1]);for(const [word,syllables]of Object.entries(dict))assert.equal([...word].length,syllables.length,word);for(const [word,py]of Object.entries({'生肖':'shēng xiào','星座':'xīng zuò','处女座':'chǔ nǚ zuò','音乐':'yīn yuè','行业':'háng yè','收藏':'shōu cáng'}))assert.equal(dict[word].join(' '),py);});
test('learning update preserves classroom and music links',()=>{assert(html.includes('https://zodiac-explorer-classroom.apriljasmineflower20.chatgpt.site/'));assert(html.includes('yZFHZmykg9w'));assert(html.includes('id="pinyin-toggle"'));});
