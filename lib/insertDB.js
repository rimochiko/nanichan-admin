var db = require('./db.js');
/*
var array = [{
	name: 'う',
	meaning: '日语五十音图ア行第三个假名',
	typeid: 4,
	kana: 'う',
	roman: 'u',
	audio: 'http://tts.hjapi.com/jp/0B444DF1BB150FEB',
}, {
	name: 'え',
	meaning: '哎。表示赞同。附和。',
	typeid: 4,
	kana: 'え',
	roman: 'e',
	audio: 'http://tts.hjapi.com/jp/373CC5B39ABE7E0A',
},{
	name: 'お',
	meaning: '嗯，欸。',
	typeid: 4,
	kana: 'お',
	roman: 'o',
	audio: 'http://tts.hjapi.com/jp/564E87345F094D21',	
},{
	name: 'か',
	meaning: '或，或者，还是。是否',
	typeid: 4,
	kana: 'か',
	roman: 'ka',
	audio: 'http://tts.hjapi.com/jp/7DE3E65FDA173CA3',
},{
	name: 'き',
	meaning: '日语五十音图 「か」行第2个假名',
	typeid: 4,
	kana: 'き',
	roman: 'ki',
	audio: 'http://tts.hjapi.com/jp/9FA0E19DC651750E',
},{
	name: 'く',
	meaning: '日语五十音图 「か」行第3个假名',
	typeid: 4,
	kana: 'く',
	roman: 'ku',
	audio: 'http://tts.hjapi.com/jp/839B844E3E8EA199',
},{
	name: 'け',
	meaning: ';表示一种摆脱不掉的感觉，总觉得',
	typeid: 4,
	kana: 'け',
	roman: 'ke',
	audio: 'http://tts.hjapi.com/jp/1A60C68F8286360E',
},{
	name: 'こ',
	meaning: '户（构成集体住宅的各个住宅）',
	typeid: 4,
	kana: 'こ',
	roman: 'ko',
	audio: 'http://tts.hjapi.com/jp/A2DD701D57F190EF',
},{
	name: 'な',
	meaning: '日语五十音图「な」行第一个假名',
	typeid: 4,
	kana: 'な',
	roman: 'na',
	audio: 'http://tts.hjapi.com/jp/5A4B2DD2747630A7',
},{
	name: 'に',
	meaning: '〈楽〉D音',
	typeid: 4,
	kana: 'に',
	roman: 'ni',
	audio: 'http://tts.hjapi.com/jp/1C4EC458D8290DD5',
}]


for(var i = 4 ;i < array.length ; i++) {
	db.insert("words", array[i]);
}*/

for(var i = 3; i<=12 ;i++) {
	let obj = {
		wordId: i,
		bookId: 1,
	}
	db.insert("wordbelong", obj);
}
