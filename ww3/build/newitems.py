# -*- coding: utf-8 -*-
"""WW3 課本原生題庫（新增）
來源：TeachResource/ppt/U1~U4_Sentences.pptx 的 Challenge Time（含詳解）
      TeachResource/ppt/WW3_U1~U4_Internationalculture_PPT.pptx 的閱讀測驗
      PageContent/Book 課文頁（Classroom English、Halloween、圖解字典）
"""

SRC = "課本"
SRC2 = "國際教育"
SRC3 = "課文"


def mc(i, sec, q, o, a, e, src=SRC):
    return {"id": "bk%03d" % i, "sec": sec, "secZh": "", "t": "mc", "q": q,
            "o": o, "a": a, "e": e, "src": src, "im": [], "au": ""}


def ox(i, sec, q, a, sub, e, src=SRC):
    return {"id": "bk%03d" % i, "sec": sec, "secZh": "", "t": "ox", "q": q,
            "a": a, "sub": sub, "e": e, "src": src, "im": [], "au": ""}


def fill(i, sec, q, a, bank, e, src=SRC):
    return {"id": "bk%03d" % i, "sec": sec, "secZh": "", "t": "type", "q": q,
            "a": a, "bank": bank, "e": e, "src": src, "im": [], "au": ""}


def multi(i, sec, body, a, bank, e, src=SRC):
    return {"id": "bk%03d" % i, "sec": sec, "secZh": "", "t": "multi", "q": "填入正確的字",
            "body": body, "a": a, "bank": bank, "e": e, "src": src, "im": [], "au": ""}


def grp(i, sec, passage, subs, e, src=SRC):
    return {"id": "bk%03d" % i, "sec": sec, "secZh": "", "t": "group", "q": "閱讀測驗",
            "passage": passage, "subs": subs, "e": e, "src": src, "im": [], "au": ""}


N = [0]
def nid():
    N[0] += 1
    return N[0]


# ==================== Get Ready：教室用語 ====================
GR = [
    mc(nid(), "Classroom English", "老師說「Be quiet.」，是什麼意思？",
       ["安靜。", "起立。", "翻開課本。"], 0, "Be quiet. ＝ 安靜。quiet 是「安靜的」。"),
    mc(nid(), "Classroom English", "「請翻到第 12 頁。」是哪一句？",
       ["Please turn to page 12.", "Please go back to page 12.", "Please close page 12."], 0,
       "turn to + 頁碼 ＝ 翻到第幾頁。"),
    mc(nid(), "Classroom English", "「跟著我唸。」是哪一句？",
       ["Repeat after me.", "Raise your hand.", "Show me your homework."], 0,
       "repeat 重複、after 在⋯⋯之後，Repeat after me. ＝ 跟著我唸。"),
    mc(nid(), "Classroom English", "老師說「Louder, please.」，是希望你怎麼做？",
       ["大聲一點。", "小聲一點。", "快一點。"], 0, "loud 大聲 → louder 比較大聲。"),
    mc(nid(), "Classroom English", "「舉手。」是哪一句？",
       ["Raise your hand.", "Put down your hand.", "Go back to your seat."], 0,
       "raise 舉起；put down 放下。這兩句常一起考。"),
    mc(nid(), "Classroom English", "「把手放下。」是哪一句？",
       ["Put down your hand.", "Raise your hand.", "Show me your hand."], 0,
       "put down ＝ 放下，和 raise（舉起）相反。"),
    mc(nid(), "Classroom English", "「讓我看你的作業。」是哪一句？",
       ["Show me your homework.", "Show me your book.", "Do your homework."], 0,
       "show 給⋯⋯看；homework 作業。"),
    mc(nid(), "Classroom English", "「回到你的座位。」是哪一句？",
       ["Go back to your seat.", "Go to the blackboard.", "Sit down, please."], 0,
       "seat 座位；go back to ＝ 回到。"),
]

# ==================== Get Ready：數字 11–20 ====================
GR += [
    mc(nid(), "Numbers", "「13」的英文是哪一個？",
       ["thirteen", "thirty", "third"], 0,
       "thirteen 13（-teen 結尾是十幾）；thirty 30（-ty 結尾是幾十）。"),
    mc(nid(), "Numbers", "「15」的英文是哪一個？",
       ["fifteen", "fifty", "fiveteen"], 0,
       "fifteen 15、fifty 50。注意 five 變成 fif-。"),
    mc(nid(), "Numbers", "「18」的英文是哪一個？",
       ["eighteen", "eighty", "eightteen"], 0,
       "eighteen 18 只有一個 t；eighty 80。"),
    mc(nid(), "Numbers", "「20」的英文是哪一個？",
       ["twenty", "twelve", "twentieth"], 0,
       "twenty 20；twelve 12。"),
    fill(nid(), "Numbers", "十二：tw___ve", "twelve",
         ["twelve", "twenty", "twice"], "twelve 12，字尾是 -elve。"),
    fill(nid(), "Numbers", "十七：sevent___n", "seventeen",
         ["seventeen", "seventy", "seven"], "seventeen 17；seventy 70。"),
    mc(nid(), "Numbers", "哪一個數字的英文拼法有兩個 t？",
       ["eighteen", "fourteen", "sixteen"], 0,
       "eighteen 有兩個 t（eigh-t-teen）；fourteen、sixteen 都只有一個 t。"),
]

# ==================== Get Ready：a / a_e ====================
GR += [
    mc(nid(), "Phonics a / a_e", "cap 和 cape 哪一個母音唸字母本音「ㄟ」？",
       ["cape", "cap", "兩個都一樣"], 0,
       "cape 有魔法 e，a 唸「ㄟ」；cap 沒有 e，a 唸短音「ㄚ」。"),
    mc(nid(), "Phonics a / a_e", "「磁磚墊」是 mat，「同伴」是哪一個？",
       ["mate", "mat", "met"], 0, "mate ＝ 同伴，加了 e 母音變長。"),
    mc(nid(), "Phonics a / a_e", "下列哪一個字和其他三個的母音唸法不同？",
       ["tape", "cap", "mat", "tap"], 0,
       "tape 是長母音 a_e；cap、mat、tap 都是短母音 a。"),
    mc(nid(), "Phonics a / a_e", "「蛋糕」的英文是哪一個？",
       ["cake", "cak", "cek"], 0, "cake ＝ c + a_e + k，a 唸「ㄟ」。"),
    fill(nid(), "Phonics a / a_e", " lake（湖）的母音是長音還是短音？請寫 long 或 short", "long",
         ["long", "short"], "lake 有魔法 e，a 唸長音。"),
]

# ==================== U1 課本 Challenge Time ====================
U1 = [
    mc(nid(), "Read and Choose", "A: It's sunny.  B: ______",
       ["Let's go to the park.", "No. It's sunny."], 0,
       "天氣晴朗適合出去玩，所以回 Let's go to the park.（我們去公園吧。）"),
    mc(nid(), "Read and Choose", "A: How's the weather?  B: ______",
       ["It's windy.", "It's green."], 0,
       "問天氣要用天氣形容詞回答。green 是顏色，不能回答天氣。"),
    mc(nid(), "Read and Choose", "A: It's rainy.  B: ______",
       ["I can ride a bike.", "I can't fly a kite."], 1,
       "下雨天不能放風箏（fly a kite），所以選 I can't fly a kite."),
    mc(nid(), "Read and Choose", "A: Is it rainy?  B: ______",
       ["Yes, it is.", "No, it's not cloudy."], 0,
       "Is it...? 的答句用 Yes, it is. / No, it's not.。第二個選項答的是 cloudy，前後不一致。"),
    mc(nid(), "Read and Choose", "A: How's the weather?  B: ______",
       ["It's the sun.", "It's sunny."], 1,
       "★ 問天氣要用「形容詞」sunny，不能說 It's the sun.（那是「它是太陽」）。"),
    multi(nid(), "Look, Read, and Write", "A: How's the ＿＿＿ ?\nB: It's ＿＿＿ .",
          ["weather", "rainy"], ["rainy", "sunny", "cloudy", "weather"],
          "問句是 How's the weather?；圖中是下雨，所以答 It's rainy."),
    multi(nid(), "Look, Read, and Write", "A: ＿＿＿ the weather?\nB: It's ＿＿＿ .",
          ["How's", "sunny"], ["How's", "windy", "cold", "sunny"],
          "How's ＝ How is。圖中是晴天，答 It's sunny."),
    multi(nid(), "Look, Read, and Write", "A: How's the weather?\nB: It's ＿＿＿ .",
          ["windy"], ["rainy", "sunny", "windy", "cloudy"],
          "圖中旗子被吹歪、樹在搖，是颳風，所以填 windy。"),
    ox(nid(), "Listen and Mark “O” or “X”", "聽一聽，句子和圖相符嗎？（It's rainy.）", 1, "It's rainy.",
       "錄音說 It's rainy.（下雨），但圖中是晴天，所以畫 X。"),
    ox(nid(), "Listen and Mark “O” or “X”", "聽一聽，句子和圖相符嗎？（It's cold.）", 0, "It's cold.",
       "錄音說 It's cold.（很冷），圖中穿厚外套，相符畫 O。"),
    grp(nid(), "Reading Comprehension",
        "Kate: What's your favorite weather, Jim?\n"
        "Jim: Take a guess.\n"
        "Kate: Windy?\n"
        "Jim: No. Try again.\n"
        "Kate: Rainy?\n"
        "Jim: No. Let me give you a hint. It's today's weather.\n"
        "Kate: You like sunny days!\n"
        "Jim: That's right! Come on! Let's ride a bike.\n"
        "*favorite 最喜歡的　Take a guess. 猜一猜。　hint 提示　today's 今天的",
        [{"q": "What's Jim's favorite weather?", "o": ["Windy.", "Rainy.", "Sunny."], "a": 2},
         {"q": "How's the weather today?", "o": ["It's sunny.", "It's rainy.", "It's windy."], "a": 0}],
        "(1) Jim 最後說 You like sunny days! 並回答 That's right!，所以最愛是晴天。(2) Jim 說 It's today's weather.，而今天就是晴天。"),
]

# ==================== U2 課本 Challenge Time ====================
U2 = [
    mc(nid(), "Read and Choose", "It ______ two o'clock.",
       ["am", "are", "is"], 2,
       "主詞是 It，be 動詞用 is。am 只跟 I，are 跟 you / we / they。"),
    mc(nid(), "Read and Choose", "______ is one twenty.",
       ["I", "It", "He"], 1,
       "說時間的主詞固定用 It。"),
    mc(nid(), "Read and Choose", "A: What time is it?  B: ______ five forty.",
       ["It", "Its", "It's"], 2,
       "It's ＝ It is，句子的動詞不能省略。Its 是「它的」，不是 It is。"),
    mc(nid(), "Read and Choose", "A: ____________  B: It's six thirty-five.",
       ["How's the weather?", "What time is it?", "How old are you?"], 1,
       "答句是時間，問句就要問時間 What time is it?"),
    mc(nid(), "Read and Choose", "A: What time is it?  B: ____________",
       ["It's ten.", "It's cloudy.", "It's red."], 0,
       "只有 It's ten.（十點）是時間，cloudy 是天氣、red 是顏色。"),
    multi(nid(), "Look, Read, and Write", "A: What time is it?\nB: It's ＿＿＿ ＿＿＿ .",
          ["six", "forty"], ["four", "six", "nine", "forty"],
          "6:40 順讀：先時針 six，再分針 forty。"),
    multi(nid(), "Look, Read, and Write", "A: What ＿＿＿ is it?\nB: It's nine ＿＿＿ .",
          ["time", "twenty"], ["color", "twenty", "forty", "time"],
          "問時間是 What time is it?；9:20 ＝ nine twenty。"),
    multi(nid(), "Look, Read, and Write", "A: ＿＿＿ time is it?\nB: It's eleven ＿＿＿ .",
          ["What", "twenty"], ["How", "twenty", "What", "forty"],
          "What time is it?；11:20 ＝ eleven twenty。"),
    ox(nid(), "Listen and Mark “O” or “X”", "聽一聽，時間和圖相符嗎？（It's eight fifteen.）", 1,
       "It's eight fifteen.", "錄音是 8:15，圖中時鐘不是 8:15，畫 X。"),
    ox(nid(), "Listen and Mark “O” or “X”", "聽一聽，時間和圖相符嗎？（It's four o'clock.）", 1,
       "It's four o'clock.", "錄音是 4:00 整點，和圖上時間不同，畫 X。"),
    grp(nid(), "Reading Comprehension",
        "My Schedule\n"
        "7:20  go to school\n"
        "4:15  go home\n"
        "6:30  do homework\n"
        "9:30  go to bed\n"
        "*schedule 行程表　go to school 上學　do homework 做作業　go to bed 睡覺",
        [{"q": "It's ________. Time to go home.", "o": ["four fifteen", "seven twenty-five", "eight forty"], "a": 0},
         {"q": "It's ________. Time to go to bed.", "o": ["seven o'clock", "eight forty", "nine thirty"], "a": 2}],
        "查表：go home 是 4:15 ＝ four fifteen；go to bed 是 9:30 ＝ nine thirty。"),
]

# ==================== U3 課本 Challenge Time ====================
U3 = [
    mc(nid(), "Read and Choose", "A: Is this ______ red pen, Ken?  B: Yes, it is.",
       ["not", "your", "you"], 1,
       "問「這是你的紅筆嗎」要用所有格 your；you 是主格，不能放名詞前面。"),
    mc(nid(), "Read and Choose", "A: Is this your pencil?  B: ______, it's not my pencil.",
       ["Yes", "No", "Is"], 1,
       "後面說 it's not my pencil（不是我的），所以前面要答 No。"),
    mc(nid(), "Read and Choose", "A: Is this your pencil?  B: ________",
       ["Yes, it's your pencil.", "Yes, it's my pencil.", "No, it's not your pencil."], 1,
       "問「是你的嗎」，肯定回答要說「是我的」：Yes, it's my pencil."),
    mc(nid(), "Read and Choose", "A: ________  B: Yes, it's my eraser. Great!",
       ["Is this your book?", "Is this your pen?", "Is this your eraser?"], 2,
       "答句提到 eraser，問句就要問 eraser，前後要一致。"),
    mc(nid(), "Read and Choose", "A: ____ this your ruler?  B: No, it's not.",
       ["Is", "Am", "Are"], 0,
       "主詞 this 是單數，be 動詞用 Is。"),
    multi(nid(), "Look, Read, and Write", "A: Is ＿＿＿ your eraser?\nB: ＿＿＿ , it's not.",
          ["this", "No"], ["that", "No", "this", "Yes"],
          "問句用 Is this...?；答句說 it's not，所以填 No。"),
    multi(nid(), "Look, Read, and Write", "A: Is this your ＿＿＿ ?\nB: Yes, it's ＿＿＿ pen.",
          ["pen", "my"], ["my", "pen", "book", "your"],
          "答句 Yes, it's my pen. 問什麼就答什麼，且要換成 my。"),
    multi(nid(), "Look, Read, and Write", "A: Is this your ＿＿＿ ?\nB: ＿＿＿ , it is.",
          ["ruler", "Yes"], ["No", "ruler", "Yes", "marker"],
          "答句 it is 是肯定，所以填 Yes。"),
    ox(nid(), "Listen and Mark “O” or “X”", "聽一聽，句子和圖相符嗎？（It's not my marker.）", 0,
       "It's not my marker.", "錄音說不是我的彩色筆，和圖相符，畫 O。"),
    ox(nid(), "Listen and Mark “O” or “X”", "聽一聽，句子和圖相符嗎？（It's my pencil. Thank you.）", 0,
       "It's my pencil. Thank you.", "錄音說這是我的鉛筆，和圖相符，畫 O。"),
    grp(nid(), "Reading Comprehension",
        "Eve: What happened?\n"
        "Joe: I can't find my pencil box. I'm sad.\n"
        "Eve: Let me help you. Let's go to the Lost and Found.\n"
        "Eve: Look! That's your pencil box.\n"
        "Joe: No. It's red. My pencil box is yellow.\n"
        "Eve: Oh! Here it is.\n"
        "Joe: Great! Thank you. Wait a minute. It's empty. I have a ruler and an eraser.\n"
        "Eve: Is this your ruler?\n"
        "Joe: No. It's blue. My ruler is green.\n"
        "Eve: Oh! Here it is. And is this your eraser?\n"
        "Joe: Yes, it is. Thank you, Eve.\n"
        "*find 找到　empty 空的",
        [{"q": "What color is Joe's pencil box?", "o": ["It's red.", "It's yellow."], "a": 1},
         {"q": "What color is Joe's ruler?", "o": ["It's blue.", "It's green."], "a": 1}],
        "Joe 說 My pencil box is yellow.、My ruler is green.。紅色鉛筆盒和藍色尺都是別人的。"),
]

# ==================== U4 課本 Challenge Time ====================
U4 = [
    mc(nid(), "Read and Choose", "A: ______ the toy car?  B: It's under the chair.",
       ["What's", "Where's", "Who's"], 1,
       "答句是位置（under the chair），問句要用 Where's（在哪裡）。"),
    mc(nid(), "Read and Choose", "A: Where's the book?  B: _____ ____ the box.",
       ["He's, in", "It's, in", "She's, on"], 1,
       "book 是「物」，主詞用 It，不能用 He / She。"),
    mc(nid(), "Read and Choose", "A: Where's the yellow marker?  B: ________",
       ["It's under the desk.", "It's not my marker.", "It's a marker."], 0,
       "問「在哪裡」，就要回答位置。另外兩個都沒有回答位置。"),
    mc(nid(), "Read and Choose", "A: Where's the green marker?  B: ________",
       ["The green marker is under the book.", "The green ruler is in the pencil box.",
        "It is my green marker."], 0,
       "問 green marker 的位置，只有第一個選項講的是 green marker 的位置。"),
    mc(nid(), "Read and Choose", "A: __________  B: The blue pen is on the pink box.",
       ["Where's the blue pen?", "Where's the blue marker?", "Is this your blue pen?"], 0,
       "答句主詞是 The blue pen，問句就要問 blue pen 在哪裡。"),
    multi(nid(), "Look, Read, and Write", "A: Where's the book?\nB: It's ＿＿＿ the ＿＿＿ .",
          ["on", "desk"], ["on", "box", "desk", "under"],
          "書在桌子「上面」且接觸，用 on the desk。"),
    multi(nid(), "Look, Read, and Write", "A: Where's the pen?\nB: It's ＿＿＿ the ＿＿＿ .",
          ["under", "book"], ["desk", "book", "in", "under"],
          "筆在書的「下面」，用 under the book。"),
    multi(nid(), "Look, Read, and Write", "A: ＿＿＿ is the ball?\nB: It's ＿＿＿ the bag.",
          ["Where", "in"], ["Where", "under", "What", "in"],
          "問位置用 Where；球在袋子「裡面」用 in。"),
    ox(nid(), "Listen and Mark “O” or “X”", "聽一聽，句子和圖相符嗎？（The pencil is under the desk.）", 1,
       "The pencil is under the desk.", "錄音說鉛筆在桌下，但圖中鉛筆在桌上，所以畫 X。"),
    ox(nid(), "Listen and Mark “O” or “X”", "聽一聽，句子和圖相符嗎？（A: Where's the pen? B: It's on the book.）", 0,
       "A: Where's the pen? B: It's on the book.", "錄音說筆在書上面，和圖相符，畫 O。"),
    grp(nid(), "Reading Comprehension",
        "Mom: Earthquake! Watch out! Take cover under the desk!\n"
        "Gary: Oh, no! It's a mess. Where's the book?\n"
        "Mom: It's under the desk.\n"
        "Gary: Where's the green marker?\n"
        "Mom: It's on the box. Here you are.\n"
        "Gary: Thank you.\n"
        "Mom: Where's my red pen?\n"
        "Gary: Look! It's in the bag.\n"
        "Mom: No. That's the pink pen. Oh! I see my red pen. It's under the chair.\n"
        "*mess 混亂",
        [{"q": "Where's the green marker?", "o": ["It's under the desk.", "It's on the box.", "It's in the bag."], "a": 1},
         {"q": "Where's the pink pen?", "o": ["It's in the bag.", "It's under the chair.", "It's in the box."], "a": 0}],
        "Mom 說 green marker 是 It's on the box.；Gary 說 pink pen 是 It's in the bag.。紅筆才在椅子下。"),
]

# ==================== 國際教育：閱讀測驗 ====================
IC = [
    mc(nid(), "國際教育 · 雪地交通", "在瑞士要登上鐵力士山（Mount Titlis）山頂，最主要的交通工具是什麼？",
       ["cable car（纜車）", "dog sled（狗拉雪橇）", "snowmobile（雪上摩托車）"], 0,
       "瑞士鐵力士山要搭三段纜車、約 45 分鐘才能到山頂。", SRC2),
    mc(nid(), "國際教育 · 雪地交通", "格陵蘭冬天國土大部分被冰原覆蓋，陸路交通主要靠什麼？",
       ["dog sled（狗拉雪橇）", "MRT（捷運）", "ship（船）"], 0,
       "格陵蘭的雪橇犬耐寒耐操，狗拉雪橇是冬天重要的陸路交通方式。", SRC2),
    mc(nid(), "國際教育 · 雪地交通", "在瑞典基律納（Kiruna）可以體驗的活動是什麼？",
       ["snowmobile 之旅", "衝浪", "熱氣球"], 0,
       "瑞典北極圈的基律納有雪上摩托車之旅，沿著北極冰湖去看冰旅館。", SRC2),
    fill(nid(), "國際教育 · 雪地交通", "「我搭公車上學。」請填入：I go to school ＿＿ bus.", "by",
         ["by", "on", "in"], "by + 交通工具（by bus / by bike / by car）；走路是 walk to school。", SRC2),

    mc(nid(), "國際教育 · 世界名鐘", "哪一座鐘以「紅色圓點造型的秒針」聞名？",
       ["瑞士國鐵鐘", "英國大笨鐘", "臺灣花鐘"], 0,
       "瑞士國鐵鐘的紅點秒針靈感來自鐵路人員的信號燈。", SRC2),
    mc(nid(), "國際教育 · 世界名鐘", "大笨鐘（Big Ben）位在哪個城市？",
       ["London（倫敦）", "New York（紐約）", "Taipei（臺北）"], 0,
       "大笨鐘在英國倫敦國會大樓西敏廳外側，1858 年鑄造。", SRC2),
    mc(nid(), "國際教育 · 世界名鐘", "陽明山花鐘每多久會響起音樂報時？",
       ["每半小時", "每一小時", "每十五分鐘"], 0,
       "花鐘每半小時響起音樂報時。", SRC2),
    mc(nid(), "國際教育 · 世界名鐘", "每年 12 月 31 日大家聚在時代廣場倒數，這個鐘叫什麼？",
       ["Countdown Clock", "Railway Clock", "Floral Clock"], 0,
       "Times Square Countdown Clock 在美國紐約曼哈頓，跨年時大家一起倒數。", SRC2),

    mc(nid(), "國際教育 · 各國護照", "臺灣護照的封面是什麼顏色？",
       ["綠色", "黑色", "紅色"], 0, "臺灣護照是綠色封面，印有青天白日徽。", SRC2),
    mc(nid(), "國際教育 · 各國護照", "哪一國的護照是黑色封面，並印有國樹「銀蕨樹」？",
       ["紐西蘭", "日本", "美國"], 0,
       "紐西蘭護照黑色封面，黑色也是紐西蘭的國家代表色。", SRC2),
    mc(nid(), "國際教育 · 各國護照", "日本護照封面上的十六瓣八重表菊紋代表什麼？",
       ["日本皇室", "日本國旗", "日本國鳥"], 0,
       "日本沒有法定國徽，習慣以代表皇室的菊花紋章作為國家象徵。", SRC2),
    mc(nid(), "國際教育 · 各國護照", "美國護照上的白頭海鵰（bald eagle）象徵什麼？",
       ["力量、勇氣、自由和不朽", "財富與商業", "農業與豐收"], 0,
       "白頭海鵰是美國國鳥，象徵力量、勇氣、自由和不朽。", SRC2),
    mc(nid(), "國際教育 · 各國護照", "出國旅行時，哪兩樣東西是必備的？",
       ["passport 和 ticket", "passport 和 water", "ticket 和 blanket"], 0,
       "課文說 We don't need water to take the plane.，但護照和機票一定要有。", SRC2),

    mc(nid(), "國際教育 · 火山與防災", "環太平洋火山帶（Ring of Fire）呈什麼形狀？",
       ["馬蹄形", "圓形", "直線"], 0,
       "環太平洋火山帶全長 40,000 公里，呈馬蹄形，區域內有 452 座火山。", SRC2),
    mc(nid(), "國際教育 · 火山與防災", "地球上大約多少比例的地震發生在環太平洋火山帶？",
       ["90%", "50%", "10%"], 0, "環太平洋火山帶上發生地球上 90% 的地震。", SRC2),
    mc(nid(), "國際教育 · 火山與防災", "有「最完美的圓錐體」之稱，還印在 100 元披索紙鈔背面的是哪座火山？",
       ["菲律賓的馬榮火山", "印尼的梅拉比火山", "臺灣的大屯火山群"], 0,
       "馬榮火山（Mayon Volcano）位在菲律賓呂宋島東南部，是菲律賓最活躍的活火山。", SRC2),
    mc(nid(), "國際教育 · 火山與防災", "地震發生時，「趴下、掩護、穩住」的英文是哪一句？",
       ["drop, cover, and hold on", "run, jump, and shout", "stand, look, and talk"], 0,
       "drop 趴下、cover 掩護、hold on 穩住，是地震時的標準動作。", SRC2),
    mc(nid(), "國際教育 · 火山與防災", "地震時「不可以」做的事是哪一項？",
       ["搭電梯（board elevators）", "躲到桌子下（take cover）", "保護頭部"], 0,
       "地震時不能搭電梯，也不能驚慌（panic），要躲到安全處。", SRC2),
    fill(nid(), "國際教育 · 火山與防災", "緊急救難包（避難包）的英文是 g__ bag。", "go",
         ["go", "get", "good"], "go bag ＝ 緊急救難包，裡面放水、藥品、手電筒、口哨、毯子、食物。", SRC2),
]

# ==================== 課文：Halloween / 圖解字典 ====================
CF = [
    mc(nid(), "Halloween 課文", "萬聖節敲門要糖果時，會說哪一句？",
       ["Trick or treat!", "Happy birthday!", "Merry Christmas!"], 0,
       "Trick or treat! ＝ 不給糖就搗蛋，是萬聖節的固定台詞。", SRC3),
    mc(nid(), "Halloween 課文", "「我們去不給糖就搗蛋吧！」是哪一句？",
       ["Let's go trick-or-treating!", "Let's go home!", "Let's go to school!"], 0,
       "go + V-ing 表示「去做某件事」：go trick-or-treating。", SRC3),
    mc(nid(), "Halloween 課文", "「紅燈！停！」是哪一句？",
       ["Red light! Stop!", "Green light! Go!", "Yellow light! Wait!"], 0,
       "red light 紅燈、stop 停。過馬路要看來車。", SRC3),
    mc(nid(), "Halloween 課文", "「那是你爺爺的房子嗎？」是哪一句？",
       ["Is that your grandpa's house?", "Is this your grandpa?", "Where is your grandpa?"], 0,
       "grandpa's ＝ 爺爺的，'s 加在人名或稱謂後面表示所有。", SRC3),
    mc(nid(), "Halloween 課文", "全身纏滿繃帶的鬼怪叫什麼？",
       ["a mummy", "a ghost", "a witch"], 0, "mummy 木乃伊，特徵是全身繃帶。", SRC3),
    mc(nid(), "Halloween 課文", "戴尖帽子、騎掃帚的是哪一個？",
       ["a witch", "a vampire", "a mummy"], 0, "witch 女巫，尖帽＋掃帚是標準造型。", SRC3),
    mc(nid(), "Halloween 課文", "南瓜挖空、刻上臉、裡面放蠟燭，叫做什麼？",
       ["a jack-o'-lantern", "a pumpkin pie", "a ghost"], 0,
       "jack-o'-lantern 南瓜燈，是萬聖節最有代表性的佈置。", SRC3),
    mc(nid(), "Halloween 課文", "萬聖節是幾月幾日？",
       ["October 31", "December 25", "January 1"], 0, "Halloween 在每年 10 月 31 日。", SRC3),
]

# ==================== 圖解字典 ====================
PD = [
    mc(nid(), "圖解字典", "「臺中多雲，攝氏 15 度。」是哪一句？",
       ["It's cloudy in Taichung. Fifteen degrees Celsius.", "It's rainy in Taipei. Twenty degrees Celsius.",
        "It's sunny in Kaohsiung. Thirty degrees Celsius."], 0,
       "cloudy 多雲、Taichung 臺中、fifteen degrees Celsius 攝氏 15 度。", SRC3),
    mc(nid(), "圖解字典", "「高雄晴朗，攝氏 30 度。」是哪一句？",
       ["It's sunny in Kaohsiung. Thirty degrees Celsius.", "It's windy in Hsinchu. Twenty-five degrees Celsius.",
        "It's cloudy in Taichung. Fifteen degrees Celsius."], 0,
       "sunny 晴朗、Kaohsiung 高雄、thirty 30。", SRC3),
    mc(nid(), "圖解字典", "新竹（Hsinchu）在天氣預報裡通常是哪一種天氣？",
       ["windy", "rainy", "sunny"], 0,
       "新竹風大，課本圖解字典用 windy 代表新竹。", SRC3),
    mc(nid(), "圖解字典", "weather forecast 是什麼意思？",
       ["天氣預報", "氣溫計", "下雨天"], 0, "forecast 預報；weather 天氣。", SRC3),
    mc(nid(), "圖解字典", "「The eraser is under the ruler.」橡皮擦在哪裡？",
       ["在尺的下面", "在尺的上面", "在尺的旁邊"], 0, "under ＝ 在⋯⋯下面。", SRC3),
    mc(nid(), "圖解字典", "degree Celsius 是什麼單位？",
       ["攝氏溫度", "公分", "公斤"], 0, "degree 度；Celsius 攝氏。25°C 唸 twenty-five degrees Celsius。", SRC3),
]

ALL = {"GR": GR, "U1": U1, "U2": U2, "U3": U3, "U4": U4, "CF": CF, "PD": PD, "IC": IC}
