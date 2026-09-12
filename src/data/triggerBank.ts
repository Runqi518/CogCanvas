import type { TriggerType } from '../types';

// 触发卡题库。内容以纯数据（数组/模板）形式存放，便于后续替换为 LLM 动态生成而不改动组件逻辑。

// 1. 强制关联卡（Bisociation）：随机不相关的词/领域
export const bisociationWords: string[] = [
  '蜂巢', '交响乐', '潮汐', '菌丝网络', '地铁线路图', '折纸', '珊瑚礁',
  '沙漏', '候鸟迁徙', '爵士即兴', '蒲公英', '发酵', '钟摆', '积木',
  '雨林', '棋局', '灯塔', '拉链', '涟漪', '万花筒', '蚁群', '齿轮',
  '细胞分裂', '瀑布', '书法', '磁场', '拼图', '洋流', '烟花', '藤蔓',
];

// 2. 视角切换卡（Perspective Shift）：随机角色
export const perspectiveRoles: string[] = [
  '5岁小孩', '竞争对手', '100年后的人', '盲人', '外星人', '你的祖母',
  '一位极简主义者', '资深工程师', '完全不懂技术的用户', '哲学家',
  '预算有限的创业者', '监管机构', '你最挑剔的客户', '一只猫', '未来的历史学家',
  '记者', '孩子的老师', '环保主义者', '艺术家', '会计', '第一次接触的新手',
  '你十年后的自己', '一位怀疑论者', '游戏玩家',
];

// 3. SCAMPER 七类问题
export interface ScamperItem {
  letter: string;
  name: string;
  question: string;
}
export const scamperItems: ScamperItem[] = [
  { letter: 'S', name: '替代 (Substitute)', question: '如果把其中的某个部分/材料/人换成别的，会怎样？' },
  { letter: 'C', name: '合并 (Combine)', question: '能否把它和另一个想法、功能或产品合并？' },
  { letter: 'A', name: '适应 (Adapt)', question: '有没有类似的东西可以借鉴？它能适应什么新场景？' },
  { letter: 'M', name: '修改/放大 (Modify)', question: '如果放大、缩小或夸张某个特征，会怎样？' },
  { letter: 'P', name: '其他用途 (Put to other uses)', question: '它还能用在什么完全不同的地方？' },
  { letter: 'E', name: '消除 (Eliminate)', question: '如果去掉某个部分或简化到极致，会剩下什么？' },
  { letter: 'R', name: '反转/重排 (Reverse)', question: '如果把顺序颠倒、角色互换或反着做，会怎样？' },
  // 额外补充的具体化提问，让抽卡内容更丰富（>=20 条）
  { letter: 'S', name: '替代', question: '谁能替代当前的执行者？换个时间或地点做会不同吗？' },
  { letter: 'S', name: '替代', question: '有没有可以替换的规则或流程？' },
  { letter: 'C', name: '合并', question: '把两个步骤合并成一个会带来什么好处？' },
  { letter: 'C', name: '合并', question: '能否与一个看似无关的领域跨界结合？' },
  { letter: 'A', name: '适应', question: '大自然/其他行业是如何解决类似问题的？' },
  { letter: 'A', name: '适应', question: '过去成功的方案能否重新拿来用？' },
  { letter: 'M', name: '修改', question: '改变颜色、形状、含义或情绪基调会怎样？' },
  { letter: 'M', name: '放大', question: '如果把它做到十倍规模会发生什么？' },
  { letter: 'P', name: '其他用途', question: '如果面向一个全新的人群，它会变成什么？' },
  { letter: 'P', name: '其他用途', question: '当它"坏掉"或被误用时，会衍生出什么新价值？' },
  { letter: 'E', name: '消除', question: '哪一步其实是多余的？删掉后如何弥补？' },
  { letter: 'E', name: '精简', question: '如果只保留一个核心功能，你会留哪个？' },
  { letter: 'R', name: '反转', question: '如果目标反过来（不追求 X 而追求非 X）会怎样？' },
  { letter: 'R', name: '重排', question: '如果先做最后一步，会打开什么思路？' },
];

// 4. 抽象阶梯卡（Abstraction Ladder）：提问模板
export const abstractionPrompts = {
  up: [
    '这件事背后更本质的目标是什么？',
    '它属于哪一个更大的类别？',
    '如果抽象成一句原则，会是什么？',
    '它想解决的根本需求是什么？',
    '把细节都去掉，剩下的核心概念是什么？',
    '它服务于什么更高层的价值？',
    '换一个更通用的说法怎么表达？',
    '这是哪一类问题的一个特例？',
  ],
  down: [
    '举一个非常具体的例子。',
    '在真实场景里它长什么样？',
    '把它拆成可以立刻执行的一小步。',
    '给出一个具体的数字、时间或对象。',
    '谁、在什么时候、用什么方式来做这件事？',
    '它最小可验证的版本是什么？',
    '如果画出来，第一帧画面是什么？',
    '举一个反例来界定它的边界。',
  ],
};

// 5. 孵化卡（Incubation）：延迟选项 & 重新推送时附带的鼓励语
export interface IncubationDelayOption {
  label: string;
  ms: number;
}
export const incubationDelayOptions: IncubationDelayOption[] = [
  { label: '30 秒后（演示）', ms: 30 * 1000 },
  { label: '2 小时后', ms: 2 * 60 * 60 * 1000 },
  { label: '1 天后', ms: 24 * 60 * 60 * 1000 },
  { label: '下次打开应用时', ms: 0 },
];

export const incubationRevisitPrompts: string[] = [
  '孵化时间到！带着新鲜的头脑重新看看它。',
  '你的潜意识可能已经想通了一些东西，现在再想想？',
  '换个心情回来了，这个想法现在有什么新角度？',
  '休息之后，有没有冒出意外的联想？',
];

// 抽卡时的连线标签
export const triggerEdgeLabel: Record<TriggerType, string> = {
  bisociation: '关联',
  abstraction: '抽象',
  perspective: '视角',
  scamper: 'SCAMPER',
  incubation: '孵化',
};

/**
 * 触发卡元信息。
 * mark：印章式单字代号（替代 emoji，贴合手帐/档案视觉）
 * code：档案编号，用于纸卡角标
 */
export const triggerMeta: Record<
  TriggerType,
  { name: string; mark: string; code: string; color: string; desc: string }
> = {
  bisociation: {
    name: '强制关联',
    mark: '联',
    code: 'BIS',
    color: '#8f6a33', // 深赭
    desc: 'Koestler 双联思维：与一个不相关的事物强行建立联系',
  },
  abstraction: {
    name: '抽象阶梯',
    mark: '梯',
    code: 'ABS',
    color: '#5f6b40', // 苔绿
    desc: '在更抽象 / 更具体之间上下移动',
  },
  perspective: {
    name: '视角切换',
    mark: '视',
    code: 'PER',
    color: '#8a4a3c', // 陶土
    desc: '换一个角色重新描述你的想法',
  },
  scamper: {
    name: 'SCAMPER',
    mark: '问',
    code: 'SCA',
    color: '#a8443a', // 红笔
    desc: '七类经典创造力提问',
  },
  incubation: {
    name: '孵化',
    mark: '孵',
    code: 'INC',
    color: '#6f6249', // 深牛皮
    desc: '标记稍后重新推送，让潜意识发酵',
  },
};
