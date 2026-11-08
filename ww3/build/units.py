# -*- coding: utf-8 -*-
"""WW3 單元教材資料：單字 / 句型 / 拼讀 / 素養 / 課文頁
來源：康軒 115年國小 Wonder World 3 電子書
      TeachResource/ppt/*.pptx（句型、發音、學習小提醒、國際教育）
      PageContent/Book/Lesson*/…jpg（課文頁）
      TeachResource/mp3/Lesson*（課文朗讀、單字發音）
"""

def _key(w):
    return "w_" + w.lower().replace("'", "").replace("-", "").replace(" ", "")


W = lambda w, zh, au=None: {"w": w, "zh": zh, "au": au if au is not None else _key(w)}

UNITS = [
    # ============================ 1. Get Ready ============================
    dict(
        no=1, label="GR", title="Get Ready", zh="暖身：複習、教室用語、數字與長短母音 a",
        pages=["p45", "p6", "p89", "p1011", "p1213"],
        words=[
            W("eleven", "十一"), W("twelve", "十二"), W("thirteen", "十三"),
            W("fourteen", "十四"), W("fifteen", "十五"), W("sixteen", "十六"),
            W("seventeen", "十七"), W("eighteen", "十八"), W("nineteen", "十九"),
            W("twenty", "二十"),
        ],
        sents=[
            {"tag": "複習·動物", "en": "Is it a cat?", "zh": "牠是一隻貓嗎？",
             "note": "回答用 It is / It's，不是 He 或 She。否定說 No, it's not."},
            {"tag": "複習·動物", "en": "No, it's not. It's a dog.", "zh": "不，不是。牠是一隻狗。"},
            {"tag": "複習·家人", "en": "Who's she?", "zh": "她是誰？",
             "note": "Who's = Who is。問「人」用 Who，問「物」用 What。"},
            {"tag": "複習·家人", "en": "She's my mother.", "zh": "她是我媽媽。"},
            {"tag": "複習·才能", "en": "Can you dance?", "zh": "你會跳舞嗎？",
             "note": "Can 開頭的問句，答 Yes, I can. / No, I can't."},
            {"tag": "複習·才能", "en": "Yes, I can.", "zh": "是的，我會。"},
            {"tag": "複習·職業", "en": "Is she a doctor?", "zh": "她是醫生嗎？",
             "note": "職業前面要加 a（a cook, a nurse, a teacher, a student）。"},
            {"tag": "複習·職業", "en": "Yes, she is.", "zh": "是的，她是。"},
            {"tag": "教室用語", "en": "Be quiet.", "zh": "安靜。"},
            {"tag": "教室用語", "en": "Please turn to page 12.", "zh": "請翻到第 12 頁。"},
            {"tag": "教室用語", "en": "Repeat after me.", "zh": "跟著我唸。"},
            {"tag": "教室用語", "en": "Louder, please.", "zh": "請大聲一點。"},
            {"tag": "教室用語", "en": "Raise your hand.", "zh": "舉手。"},
            {"tag": "教室用語", "en": "Put down your hand.", "zh": "把手放下。"},
            {"tag": "教室用語", "en": "Show me your homework.", "zh": "讓我看你的作業。"},
            {"tag": "教室用語", "en": "Go back to your seat.", "zh": "回到你的座位。"},
            {"tag": "歌謠", "en": "I take a cap and a cake for Dave.", "zh": "我拿一頂帽子和一個蛋糕給 Dave。",
             "note": "這是 Get Ready 的拼讀歌謠，cape / cap 只差一個 e。"},
        ],
        phonics=[
            {"pat": "a  → 短母音 /æ/", "rule": "字尾只有子音時，a 唸短音「ㄚ」：cap、mat、tap、hat、can、pad、rat。",
             "short": ["cap", "mat", "tap", "hat", "can", "pad", "rat"]},
            {"pat": "a_e  → 長母音 /eɪ/", "rule": "字尾有 e（e 不發音，叫「魔法 e」），a 就唸字母本音「ㄟ」：cape、mate、tape、cake、game、lake、safe。",
             "long": ["cape", "mate", "tape", "cake", "game", "lake", "safe"]},
            {"pat": "聽辨練習", "rule": "聽一聽，同一個母音字母，有沒有那個 e，音就不一樣。",
             "pairs": [["cape", "cap"], ["tape", "tap"], ["hate", "hat"], ["mat", "mate"]]},
        ],
        culture=[],
    ),

    # ============================ 2. U1 ============================
    dict(
        no=2, label="U1", title="Unit 1 The Big Wind", zh="單元 1：天氣 How's the weather?",
        pages=["p1415", "p1617", "p1819", "p2021", "p2223", "p2425", "p2627"],
        words=[
            W("sunny", "晴朗的"), W("cloudy", "多雲的"), W("rainy", "下雨的"),
            W("windy", "颳風的"), W("cold", "冷的"), W("hot", "熱的"),
        ],
        sents=[
            {"tag": "核心句型", "en": "How's the weather?", "zh": "天氣如何？",
             "note": "How's = How is。問天氣固定用這句話，不用 What's the weather。"},
            {"tag": "核心句型", "en": "It's sunny.", "zh": "天氣晴朗。",
             "note": "It's = It is。答句一定要用 It 當主詞。"},
            {"tag": "易錯提醒", "en": "It's sunny. ／ It's a sunny day.", "zh": "天氣晴朗。／今天是晴天。",
             "note": "★ 千萬不要說 It's a sunny。形容詞前面不加 a；要有名詞（day）才能加 a。"},
            {"tag": "問答補充", "en": "How's the weather there?", "zh": "那裡天氣如何？",
             "note": "there 指「那裡」，放句尾。"},
            {"tag": "問答補充", "en": "How's the weather in Taichung?", "zh": "臺中天氣如何？",
             "note": "問特定地點：How's the weather + in + 地點。"},
            {"tag": "問答補充", "en": "It's sunny and windy.", "zh": "天氣晴朗又多風。",
             "note": "要同時講兩個天氣，用 and 連接兩個形容詞。"},
            {"tag": "課文句型", "en": "It's cloudy in Taichung.", "zh": "臺中天氣多雲。"},
            {"tag": "課文句型", "en": "Let's go to the park.", "zh": "我們去公園吧。"},
            {"tag": "課文句型", "en": "How come?", "zh": "怎麼會這樣？",
             "note": "口語用法，等於 Why?，追問原因時說。"},
        ],
        phonics=[
            {"pat": "e  → 短母音 /ɛ/", "rule": "字尾只有子音時，e 唸短音「ㄝ」：bed、leg、red、them、pet、Ted、jet。",
             "short": ["bed", "leg", "red", "them", "pet", "Ted", "jet"]},
            {"pat": "e_e  → 長母音 /i/", "rule": "加上魔法 e，e 唸字母本音「一」：Eve、gene、Steve、these、theme、Pete。",
             "long": ["Eve", "gene", "Steve", "these", "theme", "Pete"]},
            {"pat": "聽辨練習", "rule": "同一個 e，有沒有尾端的 e，音完全不同。",
             "pairs": [["them", "theme"], ["pet", "Pete"], ["red", "theme"]]},
        ],
        culture=[{
            "h": "國際教育 · Transportation in Snow（雪地裡的交通）",
            "zh": "瑞典、格陵蘭、瑞士三個國家冬天長期積雪，發展出跟臺灣完全不同的交通工具。",
            "body": "瑞士的鐵力士山（Mount Titlis）要搭三段纜車、約 45 分鐘才能到山頂；瑞典北極圈的基律納（Kiruna）有雪上摩托車（snowmobile）之旅，沿著北極冰湖去看一年一度的冰旅館；格陵蘭是世界最大島嶼，冬天國土大部分被冰原覆蓋，狗拉雪橇（dog sled）就成了陸路交通方式。",
            "list": [
                ["cable car", "纜車", "瑞士鐵力士山"],
                ["snowmobile", "雪上摩托車", "瑞典基律納"],
                ["dog sled", "狗拉雪橇", "格陵蘭"],
                ["transportation", "交通工具", "本課主題字"],
            ],
            "ask": "How do you go to school? — I go to school by bus. ／ I take the MRT to school. ／ I walk to school.",
        }],
    ),

    # ============================ 3. U2 ============================
    dict(
        no=3, label="U2", title="Unit 2 Going Back Home", zh="單元 2：時間 What time is it?",
        pages=["p2829", "p3031", "p3233", "p3435", "p3637", "p3839", "p4041"],
        words=[
            W("thirty", "三十"), W("forty", "四十"), W("fifty", "五十"),
            W("twenty-five", "二十五"), W("o'clock", "整點"),
            {"w": "quarter", "zh": "四分之一；15 分鐘", "au": ""},
            {"w": "half", "zh": "一半；30 分鐘", "au": ""},
            {"w": "past", "zh": "過了（幾點）", "au": ""},
            {"w": "after", "zh": "在⋯⋯之後", "au": ""},
        ],
        sents=[
            {"tag": "核心句型", "en": "What time is it?", "zh": "現在幾點？",
             "note": "問時間固定用 What time，不能用 How much time。"},
            {"tag": "核心句型", "en": "It's twelve o'clock.", "zh": "現在十二點。",
             "note": "從問句變答句，it 和 is 的位置要對調：What time is it? → It is twelve."},
            {"tag": "易錯提醒", "en": "It's twelve o'clock. ＝ It's twelve.", "zh": "現在十二點。",
             "note": "★ o'clock 來自 of the clock，只能用在「整點」；不是整點就不能加 o'clock。o'clock 也可以省略。"},
            {"tag": "核心句型", "en": "It's twelve thirty.", "zh": "現在十二點半。",
             "note": "順讀法：先讀時針，再讀分針。12:30 = twelve thirty。"},
            {"tag": "句型補充", "en": "It's a quarter after six.", "zh": "現在六點十五分。",
             "note": "15 分鐘 = a quarter，after 是「過了」。6:15 = a quarter after six。"},
            {"tag": "句型補充", "en": "It's half past twelve.", "zh": "現在十二點半。",
             "note": "30 分鐘 = half，past 也是「過了」。12:30 = half past twelve。"},
            {"tag": "句型補充", "en": "It's a quarter to seven.", "zh": "現在六點四十五分（差一刻七點）。",
             "note": "to 是「還差」。a quarter to seven = 7 點還差 15 分 = 6:45。最容易搞錯的一種說法。"},
            {"tag": "課文句型", "en": "It's four fifteen. We must go home.", "zh": "現在四點十五分，我們必須回家了。"},
            {"tag": "課文句型", "en": "It's the school bell.", "zh": "是學校的鐘聲。"},
            {"tag": "課文句型", "en": "Time to go home.", "zh": "該回家了。"},
        ],
        phonics=[
            {"pat": "i  → 短母音 /ɪ/", "rule": "字尾只有子音時，i 唸短音「ㄧ」：fin、pig、sit、wig、pin、win、kit。",
             "short": ["fin", "pig", "sit", "wig", "pin", "win", "kit"]},
            {"pat": "i_e  → 長母音 /aɪ/", "rule": "加上魔法 e，i 唸字母本音「ㄞ」：five、hide、like、time、pine、wine、kite。",
             "long": ["five", "hide", "like", "time", "pine", "wine", "kite"]},
            {"pat": "聽辨練習", "rule": "pin / pine、win / wine 只差一個 e，母音就從短變長。",
             "pairs": [["pin", "pine"], ["win", "wine"], ["kit", "kite"]]},
        ],
        culture=[{
            "h": "國際教育 · Famous Clocks（世界知名時鐘）",
            "zh": "四個國家、四座鐘，代表四種不同的城市性格。",
            "body": "瑞士國鐵鐘（Railway Clock）位在瑞士各火車站，白底黑刻度，最大特色是紅色圓點造型的秒針，靈感來自鐵路人員的信號燈。英國倫敦的大笨鐘（Big Ben，正式名稱是 Elizabeth Tower）鑄造於 1858 年，是英國最大的鐘，每小時報時一次。臺灣陽明山的花鐘（Floral Clock）建於民國 54 年，每半小時響起音樂報時。美國紐約時代廣場的倒數鐘（Times Square Countdown Clock），每年 12 月 31 日大家聚在這裡跨年。",
            "list": [
                ["Railway Clock", "國鐵鐘", "瑞士"],
                ["Big Ben", "大笨鐘", "英國"],
                ["Floral Clock", "花鐘", "臺灣"],
                ["Countdown Clock", "倒數鐘", "美國"],
            ],
            "ask": "What time is it? — It's a quarter past three. 想一想：為什麼一秒是 60 分之 1 分？一小時為什麼是 60 分鐘？",
        }],
    ),

    # ============================ 4. Review 1 ============================
    dict(
        no=4, label="R1", title="Review 1", zh="複習 1：天氣 ＋ 時間",
        pages=["p4243", "p4445"],
        words=[
            W("sunny", "晴朗的"), W("cloudy", "多雲的"), W("rainy", "下雨的"),
            W("windy", "颳風的"), W("cold", "冷的"), W("hot", "熱的"),
            W("thirty", "三十"), W("forty", "四十"),
        ],
        sents=[
            {"tag": "複習", "en": "How's the weather in Tainan?", "zh": "臺南天氣如何？"},
            {"tag": "複習", "en": "It's hot and sunny.", "zh": "天氣炎熱又晴朗。"},
            {"tag": "複習", "en": "What time is it?", "zh": "現在幾點？"},
            {"tag": "複習", "en": "It's eight forty.", "zh": "現在八點四十分。"},
            {"tag": "複習", "en": "It's half past nine.", "zh": "現在九點半。"},
            {"tag": "複習", "en": "It's a quarter to ten.", "zh": "現在九點四十五分。"},
        ],
        phonics=[
            {"pat": "a_e / e_e / i_e 綜合", "rule": "三個長母音一起複習：a_e 唸「ㄟ」、e_e 唸「一」、i_e 唸「ㄞ」。",
             "long": ["cape", "game", "these", "Steve", "time", "kite"]},
            {"pat": "短母音對照", "rule": "同一個字母，短的唸「ㄚ／ㄝ／ㄧ」，長的唸字母本音。",
             "pairs": [["cap", "cape"], ["them", "theme"], ["pin", "pine"]]},
        ],
        culture=[],
    ),

    # ============================ 5. U3 ============================
    dict(
        no=5, label="U3", title="Unit 3 Be Honest", zh="單元 3：文具與所有格 Is this your pencil?",
        pages=["p4647", "p4849", "p5051", "p5253", "p5455", "p5657", "p5859"],
        words=[
            W("book", "書"), W("eraser", "橡皮擦"), W("marker", "彩色筆；簽字筆"),
            W("pen", "原子筆"), W("pencil", "鉛筆"), W("ruler", "尺"),
            {"w": "pencil box", "zh": "鉛筆盒", "au": ""},
        ],
        sents=[
            {"tag": "核心句型", "en": "Is this your pencil?", "zh": "這是你的鉛筆嗎？",
             "note": "Is this / Is that 開頭的問句，答句主詞要用 it。"},
            {"tag": "核心句型", "en": "Yes, it is.", "zh": "是的，它是。",
             "note": "★ 不可以說 Yes, this is。問句用 this，答句一定要換成 it。"},
            {"tag": "核心句型", "en": "No, it's not.", "zh": "不，它不是。"},
            {"tag": "完整回答", "en": "Yes, it is. It is my pencil. ／ This is my pencil.", "zh": "是的。它是我的鉛筆。／這是我的鉛筆。"},
            {"tag": "完整回答", "en": "No, it's not. It's Amy's pencil.", "zh": "不，不是。它是 Amy 的鉛筆。",
             "note": "Amy's = Amy 的。人名加 's 表示所有。"},
            {"tag": "所有格", "en": "my / your / her / his / our / their", "zh": "我的／你的／她的／他的／我們的／他們的",
             "note": "my 我的、your 你的、her 她的、his 他的、our 我們的、your 你們的、their 他們的。"},
            {"tag": "課文句型", "en": "What happened?", "zh": "發生什麼事了？"},
            {"tag": "課文句型", "en": "Let me help you.", "zh": "讓我幫你。"},
            {"tag": "課文句型", "en": "It's empty.", "zh": "它是空的。"},
        ],
        phonics=[
            {"pat": "o  → 短母音 /ɑ/", "rule": "字尾只有子音時，o 唸短音「ㄚ」：dot、fog、log、mop、hop、cod、rob。",
             "short": ["dot", "fog", "log", "mop", "hop", "cod", "rob"]},
            {"pat": "o_e  → 長母音 /o/", "rule": "加上魔法 e，o 唸字母本音「喔」：bone、cone、mole、those、code、hope、robe。",
             "long": ["bone", "cone", "mole", "those", "code", "hope", "robe"]},
            {"pat": "聽辨練習", "rule": "hop / hope、cod / code、rob / robe 只差一個 e。",
             "pairs": [["hop", "hope"], ["cod", "code"], ["rob", "robe"]]},
        ],
        culture=[{
            "h": "國際教育 · Passports Around the World（各國護照）",
            "zh": "護照封面只有四種顏色：綠、黑、紅、藍，每一本都藏著國家的象徵。",
            "body": "臺灣護照是綠色封面，印有青天白日徽。紐西蘭是黑色封面，印有國徽與國樹「銀蕨樹」，黑色也是紐西蘭的國家代表色。日本是紅色封面，印有代表皇室的十六瓣八重表菊紋；日本沒有法定國徽，習慣以菊花紋章代表國家。美國是藍色封面，印有白頭海鵰國徽，象徵力量、勇氣、自由和不朽。出國旅行一定要帶護照（passport）與機票（ticket）。",
            "list": [
                ["passport", "護照", "出國必備"],
                ["Taiwan", "臺灣", "綠色封面"],
                ["New Zealand", "紐西蘭", "黑色封面"],
                ["Japan", "日本", "紅色封面"],
                ["the USA", "美國", "藍色封面"],
            ],
            "ask": "What color is your passport? — It's green. 想一想：護照為什麼只有四種顏色？",
        }],
    ),

    # ============================ 6. U4 ============================
    dict(
        no=6, label="U4", title="Unit 4 Earthquake Drill", zh="單元 4：位置介系詞 Where's the eraser?",
        pages=["p6061", "p6263", "p6465", "p6667", "p6869", "p7071", "p7273"],
        words=[
            W("in", "在⋯⋯裡面"), W("on", "在⋯⋯上面"), W("under", "在⋯⋯下面"),
            W("box", "盒子"), W("chair", "椅子"), W("desk", "書桌"),
            W("cover", "掩護；遮蔽"), W("flashlight", "手電筒"),
            {"w": "first aid kit", "zh": "急救包", "au": ""},
            W("radio", "收音機"),
        ],
        sents=[
            {"tag": "核心句型", "en": "Where's the eraser?", "zh": "橡皮擦在哪裡？",
             "note": "Where's = Where is。問位置用 Where，答句主詞用 It。"},
            {"tag": "核心句型", "en": "It's in the box.", "zh": "它在盒子裡面。",
             "note": "in 是「在裡面」（有包圍）。"},
            {"tag": "核心句型", "en": "It's on the desk.", "zh": "它在書桌上面。",
             "note": "on 是「在上面而且有接觸」，不是懸空。懸空要用 above。"},
            {"tag": "核心句型", "en": "It's under the chair.", "zh": "它在椅子下面。",
             "note": "under 是「在下面」，兩物不一定接觸。"},
            {"tag": "易錯提醒", "en": "It's on the chair. ／ It's under the chair.", "zh": "在椅子上。／在椅子下。",
             "note": "★ 介系詞後面一定要加 the；on the 和 under the 聽起來很像，要聽清楚。"},
            {"tag": "Wh- 疑問詞", "en": "where / who / what", "zh": "哪裡／誰／什麼",
             "note": "where 問地點或位置、who 問人、what 問東西或動作。"},
            {"tag": "防災用語", "en": "Earthquake! Watch out! Take cover under the desk!", "zh": "地震！小心！躲到桌子底下！"},
            {"tag": "防災用語", "en": "Drop, cover, and hold on.", "zh": "趴下、掩護、穩住。"},
            {"tag": "課文句型", "en": "Oh, no! It's a mess.", "zh": "糟了！一團亂。"},
        ],
        phonics=[
            {"pat": "u  → 短母音 /ʌ/", "rule": "字尾只有子音時，u 唸短音「ㄚ」：bug、cup、gum、tub、cub、cut、duck。",
             "short": ["bug", "cup", "gum", "tub", "cub", "cut", "duck"]},
            {"pat": "u_e  → 長母音 /ju/", "rule": "加上魔法 e，u 唸字母本音「you」：mute、tube、tune、use、cube、cute、duke。",
             "long": ["mute", "tube", "tune", "use", "cube", "cute", "duke"]},
            {"pat": "聽辨練習", "rule": "cub / cube、cut / cute 只差一個 e。",
             "pairs": [["cub", "cube"], ["cut", "cute"], ["tub", "tube"]]},
        ],
        culture=[{
            "h": "國際教育 · Famous Volcanoes（著名火山與防災）",
            "zh": "臺灣就在環太平洋火山帶上，火山與地震是我們生活的一部分。",
            "body": "環太平洋火山帶（Ring of Fire）全長 40,000 公里、呈馬蹄形，區域內有 452 座火山，地球上 90% 的地震都在這裡發生。臺灣位在菲律賓海板塊與歐亞板塊交界，板塊擠壓造成地震頻繁；大屯火山群在臺北盆地正北方，可能是臺灣本島唯一的活火山。菲律賓的馬榮火山（Mayon Volcano）有「最完美的圓錐體」之稱，印在 100 元披索紙鈔背面。印尼的梅拉比火山（Mount Merapi）是全球最活躍的火山之一。火山爆發會帶來海嘯（tsunami）、地震（earthquake）與空氣汙染（air pollution）。",
            "list": [
                ["Ring of Fire", "環太平洋火山帶", "452 座火山"],
                ["Tatun Volcano Group", "大屯火山群", "臺灣"],
                ["Mayon Volcano", "馬榮火山", "菲律賓"],
                ["Mount Merapi", "梅拉比火山", "印尼"],
                ["earthquake drill", "防震演習", "DOs"],
                ["go bag", "緊急救難包", "水、藥、手電筒、口哨、毯子、食物"],
                ["drop, cover, and hold on", "趴下、掩護、穩住", "地震時"],
            ],
            "ask": "地震時該做什麼？DOs: drop, cover, and hold on. ／ DON'Ts: don't panic, don't board elevators. 想一想：你的避難包裡要放什麼？",
        }],
    ),

    # ============================ 7. Review 2 ============================
    dict(
        no=7, label="R2", title="Review 2", zh="複習 2：文具、所有格與位置",
        pages=["p7475", "p7677"],
        words=[
            W("book", "書"), W("eraser", "橡皮擦"), W("marker", "彩色筆"),
            W("pencil", "鉛筆"), W("ruler", "尺"), W("in", "在⋯⋯裡面"),
            W("on", "在⋯⋯上面"), W("under", "在⋯⋯下面"),
        ],
        sents=[
            {"tag": "複習", "en": "Is this your marker?", "zh": "這是你的彩色筆嗎？"},
            {"tag": "複習", "en": "No, it's not. It's his marker.", "zh": "不，不是。它是他的彩色筆。"},
            {"tag": "複習", "en": "Where's my ruler?", "zh": "我的尺在哪裡？"},
            {"tag": "複習", "en": "It's under the book.", "zh": "它在書的下面。"},
            {"tag": "複習", "en": "The pencil is in the pencil box.", "zh": "鉛筆在鉛筆盒裡。"},
        ],
        phonics=[
            {"pat": "o_e / u_e 綜合", "rule": "o_e 唸「喔」、u_e 唸「you」。",
             "long": ["bone", "cone", "those", "cube", "cute", "tune"]},
            {"pat": "短母音對照", "rule": "hop / hope、cut / cute 只差一個 e。",
             "pairs": [["hop", "hope"], ["cut", "cute"], ["tub", "tube"]]},
        ],
        culture=[],
    ),

    # ============================ 8. Halloween ============================
    dict(
        no=8, label="CF", title="Halloween", zh="文化與節慶：萬聖節",
        pages=["p7879", "p8081", "p8283"],
        words=[
            {"w": "a ghost", "zh": "鬼", "au": "w_aghost"},
            {"w": "a jack-o'-lantern", "zh": "南瓜燈", "au": "w_ajackolantern"},
            {"w": "a mummy", "zh": "木乃伊", "au": "w_amummy"},
            {"w": "a vampire", "zh": "吸血鬼", "au": "w_avampire"},
            {"w": "a witch", "zh": "女巫", "au": "w_awitch"},
            {"w": "a black cat", "zh": "黑貓", "au": ""},
        ],
        sents=[
            {"tag": "課文句型", "en": "Let's go trick-or-treating!", "zh": "我們去「不給糖就搗蛋」吧！",
             "note": "trick-or-treat 是萬聖節要糖果的活動；go + V-ing 表示去做某件事。"},
            {"tag": "課文句型", "en": "Hooray!", "zh": "萬歲！"},
            {"tag": "課文句型", "en": "Red light! Stop!", "zh": "紅燈！停！"},
            {"tag": "課文句型", "en": "Is that your grandpa's house?", "zh": "那是你爺爺的房子嗎？",
             "note": "grandpa's = 爺爺的。所有格 's 要加在名詞前面那個人身上。"},
            {"tag": "課文句型", "en": "Yes!", "zh": "是的！"},
            {"tag": "課文句型", "en": "Trick or treat!", "zh": "不給糖就搗蛋！",
             "note": "萬聖節敲門時的固定台詞。"},
            {"tag": "文化知識", "en": "Halloween is on October 31.", "zh": "萬聖節在 10 月 31 日。"},
        ],
        phonics=[],
        culture=[{
            "h": "文化與節慶 · Halloween（萬聖節）",
            "zh": "10 月 31 日，孩子們打扮成鬼怪，提著南瓜燈去要糖果。",
            "body": "萬聖節（Halloween）在每年 10 月 31 日。孩子們會穿上嚇人的服裝——鬼（ghost）、木乃伊（mummy）、吸血鬼（vampire）、女巫（witch）——提著南瓜燈（jack-o'-lantern）挨家挨戶敲門，說「Trick or treat!（不給糖就搗蛋）」。家家戶戶會用南瓜燈、蝙蝠、黑貓佈置，這是從歐洲的「萬聖夜」習俗演變而來的。",
            "list": [
                ["a ghost", "鬼", "最簡單的裝扮：披白布"],
                ["a jack-o'-lantern", "南瓜燈", "南瓜挖空、刻臉、放蠟燭"],
                ["a mummy", "木乃伊", "全身纏繃帶"],
                ["a vampire", "吸血鬼", "黑披風＋尖牙"],
                ["a witch", "女巫", "尖帽子＋掃帚"],
                ["Trick or treat!", "不給糖就搗蛋", "敲門台詞"],
            ],
            "ask": "What do you want to be for Halloween? — I want to be a ghost. 想一想：為什麼南瓜燈要刻一張臉？",
        }],
    ),

    # ============================ 9. Picture Dictionary ============================
    dict(
        no=9, label="PD", title="Picture Dictionary", zh="圖解字典：天氣、城市、溫度與房間用品",
        pages=["p8485", "p8687", "p8889"],
        words=[
            {"w": "degree Celsius", "zh": "攝氏度數", "au": "w_twentydegreescelsius"},
            {"w": "weather forecast", "zh": "天氣預報", "au": ""},
            {"w": "Taipei", "zh": "臺北", "au": "w_taipei"},
            {"w": "Taichung", "zh": "臺中", "au": ""},
            {"w": "Tainan", "zh": "臺南", "au": ""},
            {"w": "Yilan", "zh": "宜蘭", "au": ""},
            {"w": "Kaohsiung", "zh": "高雄", "au": "w_kaohsiung"},
            {"w": "Hsinchu", "zh": "新竹", "au": "w_hsinchu"},
            {"w": "robot", "zh": "機器人", "au": "w_robot"},
            {"w": "kite", "zh": "風箏", "au": "w_kite"},
        ],
        sents=[
            {"tag": "圖解字典", "en": "It's cloudy in Taichung. Fifteen degrees Celsius.", "zh": "臺中多雲，攝氏 15 度。"},
            {"tag": "圖解字典", "en": "It's rainy in Taipei. Twenty degrees Celsius.", "zh": "臺北下雨，攝氏 20 度。"},
            {"tag": "圖解字典", "en": "It's sunny in Kaohsiung. Thirty degrees Celsius.", "zh": "高雄晴朗，攝氏 30 度。"},
            {"tag": "圖解字典", "en": "It's windy in Hsinchu. Twenty-five degrees Celsius.", "zh": "新竹颳風，攝氏 25 度。"},
            {"tag": "天氣預報", "en": "Taipei: 25°C, 40%", "zh": "臺北：25 度，降雨機率 40%",
             "note": "天氣預報（weather forecast）會同時給溫度和降雨機率。"},
            {"tag": "房間用品", "en": "The book is on the bed. The marker is on the desk.", "zh": "書在床上。彩色筆在桌上。"},
            {"tag": "房間用品", "en": "The eraser is under the ruler.", "zh": "橡皮擦在尺下面。"},
        ],
        phonics=[],
        culture=[{
            "h": "圖解字典 · 一頁看懂全冊",
            "zh": "把全冊的單字分成四大類，考前看這一頁最快。",
            "body": "天氣：sunny、cloudy、rainy、windy、cold、hot。時間：o'clock、quarter、half、past、after、to、thirty、forty、fifty。文具：book、eraser、marker、pen、pencil、ruler、pencil box。位置：in、on、under。房間用品：clock、kite、robot、car、box、chair、desk。城市與溫度：Taipei、Taichung、Tainan、Yilan、Kaohsiung、Hsinchu、degree Celsius。",
            "list": [
                ["天氣", "sunny / cloudy / rainy / windy / cold / hot", "How's the weather?"],
                ["時間", "o'clock / quarter / half / past / after / to", "What time is it?"],
                ["文具", "book / eraser / marker / pen / pencil / ruler", "Is this your pencil?"],
                ["位置", "in / on / under", "Where's the eraser?"],
            ],
            "ask": "把這一頁當成考前總檢查：每一類都能自己說出中文，就代表準備好了。",
        }],
    ),
]
