/**
 * 《易命之书》52条人生法则数据
 * 从原文档提取，用于问答系统的知识库检索
 */

export interface Rule {
  id: number;
  title: string;
  text: string;
  category: string;
  keywords: string[];
}

export const RULES: Rule[] = [
  // === 修身篇 ===
  {
    id: 1,
    title: "洒扫庭除",
    text: "洒扫庭除，使身不近秽；素洁仪容，使秽不附身。勿卧于污秽熏天、杂然无序之所，勿寝于阴暗潮湿之地。",
    category: "修身",
    keywords: ["打扫", "整洁", "环境", "房间", "秩序", "清洁", "卫生", "杂乱"]
  },
  {
    id: 2,
    title: "应时而兴",
    text: "应时而兴，应时而食，应时而作，应时而息。四时有序，心神乃一。",
    category: "修身",
    keywords: ["作息", "规律", "早睡早起", "时间", "节奏", "饮食", "生物钟"]
  },
  {
    id: 3,
    title: "言讷而实",
    text: "言讷而实，语善而真。不泄恶语，不传妄言，不涉谤讥。君子之运，发于唇齿。",
    category: "修身",
    keywords: ["说话", "言语", "沟通", "谣言", "承诺", "沉默", "口德"]
  },
  {
    id: 12,
    title: "竭诚以赴",
    text: "凡所当为之事，必竭诚以赴，务尽其能。",
    category: "修身",
    keywords: ["尽力", "认真", "专注", "敬业", "投入", "极致", "全力以赴"]
  },
  {
    id: 29,
    title: "可赏勿溺",
    text: "鉴物犹鉴人，辨其质，可赏而勿溺；溺则神气为所夺。",
    category: "修身",
    keywords: ["爱好", "沉迷", "节制", "物欲", "贪恋", "过度", "上瘾"]
  },
  {
    id: 34,
    title: "怒损气数",
    text: "怒则智散，亦损气数。",
    category: "修身",
    keywords: ["愤怒", "脾气", "情绪控制", "发火", "暴躁", "冷静"]
  },
  {
    id: 38,
    title: "坠壑图出",
    text: "坠于深壑；偃卧无为，常也；百计图出，乃大运之兆。",
    category: "修身",
    keywords: ["低谷", "困境", "逆境", "翻身", "振作", "挣扎", "突破"]
  },
  {
    id: 42,
    title: "逐成务修",
    text: "逐成者，众庶之所趋；务修者，达人之所怀。怀修之人，是谓成矣。",
    category: "修身",
    keywords: ["修行", "成长", "自我提升", "内在", "成功", "修炼"]
  },
  {
    id: 49,
    title: "讼过内省",
    text: "事之不成，必在己也。讼过而内省，克己而复正。",
    category: "修身",
    keywords: ["反思", "自省", "内疚", "自责", "改正", "检讨", "自身原因"]
  },
  {
    id: 52,
    title: "察起心动念",
    text: "观喜怒于己身，察起心动念，此乃运中之至运也。",
    category: "修身",
    keywords: ["觉察", "念头", "情绪", "内心", "自我认知", "正念"]
  },

  // === 财富篇 ===
  {
    id: 4,
    title: "以明处世求财",
    text: "以见利之明处世，财可求也。以侵害之心得财，悖逆天道，必遭反报；非数倍偿赎，即气运消减，身心俱伤。",
    category: "财富",
    keywords: ["赚钱", "求财", "正当", "利益", "发财", "收入", "金钱", "正道"]
  },
  {
    id: 8,
    title: "旧业勿轻弃",
    text: "业之道，旧业勿轻弃。虽利薄，然根基之所系，存身之本也。若新业既成，根基稳固，方可择之而从。若二者得兼，善之善者也。",
    category: "财富",
    keywords: ["跳槽", "换工作", "旧业", "根基", "稳定", "转型", "创业", "职业"]
  },
  {
    id: 25,
    title: "出资如博戏",
    text: "出资市金，逐盐铁之利者，如博戏，肇端当有尽付一掷之志。所谓必成者，诈也。至若合营之事，尤为险途。",
    category: "财富",
    keywords: ["投资", "生意", "合伙", "风险", "赌博心态", "创业风险", "合营"]
  },
  {
    id: 26,
    title: "善用财",
    text: "善用财者，不啻重于善牟利者也。不擅牟利，乞食而已；苟不谙用财之道，或致身困，乃至罹祸倾覆。",
    category: "财富",
    keywords: ["理财", "花钱", "消费观", "财富管理", "储蓄", "投资回报"]
  },
  {
    id: 30,
    title: "用度可奢不可费",
    text: "用度可奢，然绝不可费。费者，若财货食粮；究其本，费运气也。",
    category: "财富",
    keywords: ["浪费", "奢侈", "挥霍", "浪费运气", "浪费钱", "浪费生命"]
  },
  {
    id: 33,
    title: "必费己财",
    text: "必费己财；未入囊者，非己有也。若不得已而假人之财，须报之以利。慎勿假占不偿，恐运尽而祸至。",
    category: "财富",
    keywords: ["借钱", "欠债", "还钱", "财务独立", "债务", "人情债"]
  },
  {
    id: 39,
    title: "计所有不念所无",
    text: "计其所有而不念所无者，斯为吉人之兆也。",
    category: "财富",
    keywords: ["知足", "满足", "感恩", "攀比", "嫉妒", "珍惜"]
  },

  // === 人际篇 ===
  {
    id: 9,
    title: "初遇生人速避之",
    text: "初遇生人，若生厌憎，心神不安，速避之。见使君怡然者，可近而交，然须慎察其行。必试其信义，此乃立世之本。若察其信劣，急避如避刃矢。",
    category: "人际",
    keywords: ["第一印象", "远离", "小人", "识人", "直觉", "厌恶感", "防备"]
  },
  {
    id: 10,
    title: "贵人如云水",
    text: "父母者，天授贵人也；困厄中施以援手者，贵人也；指迷津于惘途者，贵人也；甘苦与共之友，贵人也；生死相托之夫妻，互为贵人也。然贵人非固守一世，乃如云水流转不息。当明眸察周遭之贵气，承其瑞意，则如握机缘之枢机。",
    category: "人际",
    keywords: ["贵人", "帮助", "恩人", "朋友", "伴侣", "机遇", "人脉"]
  },
  {
    id: 11,
    title: "事未成勿泄",
    text: "吾观处世之道，事未成勿泄于未预者，利既获勿宣于不知者。倘炫其功，恐招非议而损其益。",
    category: "人际",
    keywords: ["低调", "保密", "炫耀", "闷声发大财", "不张扬", "秘密"]
  },
  {
    id: 13,
    title: "识人察举止",
    text: "识人者，当涤尽浮光，弃置衔冕，略其形骸，屏绝人议。惟观其言行之微，察其举止之细，则彼若素缣一卷，自将仁善鄙诈，贞邪曲直，书而示汝矣。",
    category: "人际",
    keywords: ["识人", "观察", "细节", "品性", "人品", "判断"]
  },
  {
    id: 14,
    title: "御人以疑始",
    text: "御人当以疑始，必待其事毕。绳可束其身，岂能羁其志？人为灵长，旦暮异焉，唯以疑目察之，乃见其纤隐之变。",
    category: "人际",
    keywords: ["怀疑", "信任", "防备", "观察变化", "人心难测", "谨慎"]
  },
  {
    id: 16,
    title: "交游分三等",
    text: "交游之众，当分三等：其一唯利是图，毋涉情义；其二唯情是守，毋涉利欲；此二者不可逾，逾则必遭其咎。其三情利皆可谋。得此辈愈众，则气运愈昌。",
    category: "人际",
    keywords: ["交友", "圈子", "朋友", "利益", "关系", "社交", "朋友圈"]
  },
  {
    id: 19,
    title: "视询隐衷",
    text: "观一人，细察之，见其品性端良，乃欲与之交。可视询其隐衷，若其诚言不讳，则证其心已视尔为友矣。",
    category: "人际",
    keywords: ["真心", "坦诚", "交心", "信任", "朋友", "隐藏"]
  },
  {
    id: 21,
    title: "众悦险伏侧",
    text: "众悦者，气运亨也，然险亦伏于侧也。",
    category: "人际",
    keywords: ["受欢迎", "从众", "阿谀奉承", "拍马屁", "圆滑", "讨好"]
  },
  {
    id: 22,
    title: "夫妇以信为基",
    text: "夫妇之道，首以信为万事之基，次则消弭龃龉，复可截长续短，尤贵同心以御外。如此，则贵人之气可臻其极，偕老之道得以长久。",
    category: "人际",
    keywords: ["婚姻", "夫妻", "信任", "感情", "家庭", "伴侣", "吵架"]
  },
  {
    id: 23,
    title: "勿假贵人自壮",
    text: "勿以交贵者为荣，勿假其名以自壮。若此，是转时运于人，而己之气数益损矣。",
    category: "人际",
    keywords: ["攀附", "靠关系", "借势", "自立", "自强", "人脉"]
  },
  {
    id: 24,
    title: "平等相对",
    text: "欲得言谈之真味，必以平等相对。至亲犹然。倘比执守尊卑之见，则所对无非虚文俗套耳。",
    category: "人际",
    keywords: ["平等", "尊重", "沟通", "长辈", "亲子关系", "架子"]
  },
  {
    id: 43,
    title: "不图报善待左右",
    text: "不图报而善待左右，乃汝之福也。",
    category: "人际",
    keywords: ["善良", "付出", "不求回报", "善待", "身边人", "福报"]
  },
  {
    id: 45,
    title: "绝期于人得鸿运",
    text: "绝期于人，得之鸿运。",
    category: "人际",
    keywords: ["独立", "不依赖", "靠自己", "期待", "放手", "解脱"]
  },
  {
    id: 47,
    title: "能宽则宽",
    text: "能宽则宽，盖宽乃居高临下之态也。",
    category: "人际",
    keywords: ["宽容", "包容", "大度", "计较", "放下", "原谅"]
  },
  {
    id: 48,
    title: "识人识物识己",
    text: "识人、识物、识己，其道一也。",
    category: "人际",
    keywords: ["自知", "认知", "自我", "他人", "万物", "洞察"]
  },

  // === 心态篇 ===
  {
    id: 5,
    title: "旧过未至戒贪",
    text: "旧过过，未未到。事有先后，逐一面之，戒之在贪。",
    category: "心态",
    keywords: ["后悔", "焦虑", "过去", "未来", "当下", "纠结", "内耗"]
  },
  {
    id: 7,
    title: "不贪为上境",
    text: "不贪者，贪之上境也。",
    category: "心态",
    keywords: ["欲望", "贪心", "知足", "简单", "少欲", "满足"]
  },
  {
    id: 28,
    title: "勿自贻伊戚",
    text: "勿自贻伊戚，凡桎梏皆厄气运。外锢虽不可御，内心毋复筑樊牢。",
    category: "心态",
    keywords: ["自我束缚", "枷锁", "内耗", "想不开", "钻牛角尖", "放下"]
  },
  {
    id: 31,
    title: "勿急心躁",
    text: "勿急，心躁易失。盖急与运之频不相合也。",
    category: "心态",
    keywords: ["急躁", "着急", "慢", "耐心", "从容", "欲速不达"]
  },
  {
    id: 32,
    title: "勿占人便宜",
    text: "勿占人财利之便，占其便则遗运于人；不患人取财利之便，取其便则遗运于己。",
    category: "心态",
    keywords: ["占便宜", "吃亏", "让利", "格局", "分享", "利益"]
  },
  {
    id: 35,
    title: "遇不可解之事避之",
    text: "遇不可解之事，避而俟之，或乃上策；强为之者，多反受其咎。",
    category: "心态",
    keywords: ["逃避", "等待", "硬扛", "时机", "放下", "不强求"]
  },
  {
    id: 36,
    title: "正对内惧得天眷",
    text: "正对内惧，乃得天眷。",
    category: "心态",
    keywords: ["恐惧", "害怕", "勇敢", "面对", "内心", "战胜"]
  },
  {
    id: 37,
    title: "勿自怜",
    text: "勿自怜，时运亦厌之。",
    category: "心态",
    keywords: ["自怜", "可怜自己", "抱怨", "积极", "正能量", "自怨自艾"]
  },
  {
    id: 40,
    title: "灵根身树运叶",
    text: "灵若根，身若树，运若叶。叶虽凋落，苟灵不死、身不枯，逢其时，终见枝繁叶茂。",
    category: "心态",
    keywords: ["希望", "坚持", "根基", "转机", "东山再起", "韧性"]
  },
  {
    id: 41,
    title: "豁尽所有面厚如革",
    text: "豁尽所有乃制胜之枢，面厚如革实为初基。事成则万口争颂，功败则形迹俱冥。故无须怀讥诮之虞于方寸，洞明此理者，天岂肯薄待之？",
    category: "心态",
    keywords: ["勇气", "豁出去", "脸皮厚", "冒险", "无畏", "破釜沉舟"]
  },
  {
    id: 44,
    title: "逢凶谋化吉",
    text: "逢凶时，当先谋化吉之道。",
    category: "心态",
    keywords: ["化险为夷", "转危为安", "解决问题", "逆境", "办法", "策略"]
  },
  {
    id: 46,
    title: "容受万事御运在己",
    text: "容受万事，御运在己。洞明造化，即得真运。",
    category: "心态",
    keywords: ["接受", "掌控", "随缘", "心态", "自在", "顺其自然"]
  },
  {
    id: 51,
    title: "无待而常适",
    text: "无待而常适者，天之所厚，亦至运也。",
    category: "心态",
    keywords: ["自由", "独立", "不依赖", "自在", "随遇而安", "洒脱"]
  },

  // === 运势篇 ===
  {
    id: 6,
    title: "莫趋捷径",
    text: "今人多趋捷径，然未察其境塞途拥，而康庄之衢，阒其无人。若行事觉轻安自得者，此即汝之坦途也。",
    category: "运势",
    keywords: ["捷径", "弯路", "踏实", "选择", "方向", "从容"]
  },
  {
    id: 7,
    title: "顺应天时",
    text: "天时至，气运生，体察而顺应之。若能与之偕行，则如顺水行舟，无往不利。",
    category: "运势",
    keywords: ["时机", "趋势", "顺势", "风口", "把握机会", "天时"]
  },
  {
    id: 15,
    title: "观气运蓄",
    text: "判事之成否，其下者取利，其次者取鉴，其至者观乎气运之蓄。",
    category: "运势",
    keywords: ["判断", "决策", "大局", "趋势", "眼光", "格局"]
  },
  {
    id: 17,
    title: "乘势而起",
    text: "方时运至际，万象皆佐。所当为者，惟体察而顺应之，乘势而起。然骄矜造作，挥霍无度，实悖逆福运。慎之。",
    category: "运势",
    keywords: ["运势", "乘势", "谦虚", "低调", "好运", "把握"]
  },
  {
    id: 18,
    title: "谋宜见远忘私",
    text: "共事欲成，首在谋宜而见远，次在尽其才，至要者忘私。三者备，则事可成其八九。余者，顺天时而已。",
    category: "运势",
    keywords: ["合作", "团队", "远见", "无私", "共赢", "格局"]
  },
  {
    id: 20,
    title: "困厄自疏",
    text: "逢困厄而能自疏者，有福之人也；临险阻犹可坦然而笑者，具大运之相也。",
    category: "运势",
    keywords: ["困境", "豁达", "从容", "乐观", "释然", "放下"]
  },
  {
    id: 27,
    title: "勿强求险事",
    text: "勿强求险巇之事以耽危殆之娱，如此则大伤气运。向者无恙，惟气运未尽耳。",
    category: "运势",
    keywords: ["冒险", "赌博", "极限", "克制", "保命", "止损"]
  },
];

/** 按类别分组 */
export const CATEGORIES = [...new Set(RULES.map((r) => r.category))];

/** 中文分词：简单按字符粒度提取有意义的2-3字片段 */
function extractNgrams(text: string, n: number): string[] {
  const results: string[] = [];
  for (let i = 0; i <= text.length - n; i++) {
    results.push(text.slice(i, i + n));
  }
  return results;
}

/** 搜索相关法则（关键词匹配 + 分词匹配 + 语义扩展） */
export function searchRules(query: string, topK: number = 5): Rule[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];

  // 提取查询的分词（2-3字n-gram）
  const queryBigrams = extractNgrams(lowerQuery, 2);
  const queryTrigrams = extractNgrams(lowerQuery, 3);

  const scored = RULES.map((rule) => {
    let score = 0;

    // --- 精确子串匹配 ---
    // 标题精确匹配
    if (rule.title.includes(lowerQuery)) score += 15;
    // 文本精确匹配
    if (rule.text.includes(lowerQuery)) score += 8;

    // --- 分词匹配（n-gram 重叠） ---
    // 标题分词匹配
    const titleBigrams = extractNgrams(rule.title, 2);
    const titleTrigrams = extractNgrams(rule.title, 3);
    for (const qg of queryBigrams) {
      if (titleBigrams.some(tg => tg.includes(qg) || qg.includes(tg))) score += 5;
    }
    for (const qt of queryTrigrams) {
      if (titleTrigrams.some(tt => tt.includes(qt) || qt.includes(tt))) score += 3;
    }

    // 文本分词匹配
    const textBigrams = extractNgrams(rule.text, 2);
    const textTrigrams = extractNgrams(rule.text, 3);
    for (const qg of queryBigrams) {
      if (textBigrams.some(tb => tb.includes(qg) || qg.includes(tb))) score += 2;
    }

    // --- 关键词匹配 ---
    for (const kw of rule.keywords) {
      if (kw.includes(lowerQuery) || lowerQuery.includes(kw)) {
        score += 5;
      } else {
        // 关键词与查询分词的部分匹配
        for (const qg of queryBigrams) {
          if (kw.includes(qg) || qg.includes(kw)) {
            score += 2;
            break;
          }
        }
      }
    }

    // --- 类别关键词匹配 ---
    const categoryMap: Record<string, string[]> = {
      修身: ["修身", "自律", "品行", "修养", "健康", "睡眠", "失眠", "休息", "作息"],
      财富: ["财富", "金钱", "钱", "财", "经济", "收入", "支出", "工资", "薪资", "投资"],
      人际: ["人际", "人", "朋友", "同事", "关系", "社交", "交往", "领导", "老板", "上级", "下属"],
      心态: ["心态", "心", "情绪", "精神", "内心", "心理", "压力", "焦虑", "迷茫", "方向", "困惑"],
      运势: ["运势", "运", "命", "命运", "运气", "趋势", "前途", "未来", "转折"],
    };
    const catKws = categoryMap[rule.category] || [];
    for (const ck of catKws) {
      if (ck.includes(lowerQuery) || lowerQuery.includes(ck)) {
        score += 3;
      } else {
        for (const qg of queryBigrams) {
          if (ck.includes(qg) || qg.includes(ck)) {
            score += 1;
            break;
          }
        }
      }
    }

    // --- 特殊语义映射（常见问题的快捷匹配） ---
    const semanticMap: Record<string, number[]> = {
      // 压力/失眠/焦虑 -> 修身(自律作息) + 心态
      "压力": [2, 34, 37, 49, 52],
      "失眠": [2, 34, 49, 52],
      "焦虑": [5, 28, 31, 37, 49],
      "迷茫": [38, 40, 44, 46, 51],
      "方向": [6, 15, 38, 40, 46],
      "辞职": [8, 17, 25, 27, 41],
      "创业": [8, 17, 25, 27, 41],
      "跳槽": [8, 17, 25, 27, 41],
      "分手": [22, 45, 47, 49, 51],
      "离婚": [22, 45, 47, 49, 51],
      "吵架": [22, 24, 34, 47, 49],
      "借钱": [33, 39, 43, 47, 48],
      "欠债": [33, 30, 39, 46, 49],
      "失败": [38, 40, 41, 44, 49],
      "困难": [38, 40, 44, 46, 49],
      "生病": [1, 2, 34, 37, 49],
      "健康": [1, 2, 34, 37, 49],
      "父母": [10, 22, 24, 43, 48],
      "孩子": [24, 43, 47, 48, 52],
      "孤独": [43, 45, 47, 51, 52],
      "孤独感": [43, 45, 47, 51, 52],
    };
    for (const [senseKey, ruleIds] of Object.entries(semanticMap)) {
      if (lowerQuery.includes(senseKey)) {
        if (ruleIds.includes(rule.id)) {
          score += 8;
        }
      }
    }

    return { rule, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.rule);
}

/** 构建系统 Prompt */
export function buildPrompt(question: string, rules: Rule[]): string {
  const rulesText = rules
    .map((r) => `【${r.category}】第${r.id}术 · ${r.title}：${r.text}`)
    .join("\n\n");

  return `你是一个精通《易命之书》52条人生法则的人生导师，名叫"易命先生"。

你的任务是根据用户的问题，引用《易命之书》中的法则，给出有深度、有温度的人生建议。

## 可用的法则

${rulesText}

## 回答要求

1. **开场**：先共情，理解用户的处境和感受，一句话概括你的核心观点
2. **引用法则**：明确引用相关的"第X术"，简要解释该法则的含义
3. **具体分析**：结合用户的具体情况，逐条分析这些法则如何适用于他的处境
4. **行动建议**：给出具体的、可操作的建议，不要太抽象
5. **结尾**：用一句温暖有力的话收尾，给用户信心

## 语气风格

- 平和、有哲理但不玄乎
- 像一个阅历丰富的长者，不是高高在上的说教
- 适当使用古文引用，但要解释清楚
- 字数控制在300-500字

## 用户问题

${question}`;
}
