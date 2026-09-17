// 创意工作流阶段定义（对齐 PRD：发散 / 触发 / 聚类 / 收敛 / 导出）
export interface WorkflowStep {
  id: string;
  index: number;
  phase: 'diverge' | 'converge' | 'output';
  title: string;
  subtitle: string;
  mark: string; // 旧数据兼容；界面使用线性图标
  color: string; // 手帐系强调色（赭 / 苔 / 陶 / 红笔）
  description: string;
  principle: string; // 认知科学原理
  actions: string[]; // 用户可执行的动作
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'record',
    index: 1,
    phase: 'diverge',
    title: '发散记录',
    subtitle: 'Diverge & Record',
    mark: '记',
    color: '#6f6249',
    description:
      '在无限画布上自由倾倒所有想法，把念头从大脑搬到画布，外部化工作记忆、减轻认知负荷。先发散，不评判。',
    principle: '外部化工作记忆 · Miller 7±2 定律',
    actions: ['双击空白处创建节点', '拖拽右侧圆点建立连线', '自由缩放 / 平移 / 框选'],
  },
  {
    id: 'trigger',
    index: 2,
    phase: 'diverge',
    title: '认知触发',
    subtitle: 'Cognitive Triggers',
    mark: '触',
    color: '#8f6a33',
    description:
      '选中任意节点，"抽"一张认知科学触发卡。系统主动介入，用异质刺激打破功能固着与思维定式。',
    principle: '双联思维 · 观点采择 · SCAMPER · 孵化效应',
    actions: ['选择 5 类触发卡之一', '触发卡自动生成节点并连线', '标记"孵化中"让潜意识发酵'],
  },
  {
    id: 'cluster',
    index: 3,
    phase: 'converge',
    title: '收敛聚拢',
    subtitle: 'Converge & Cluster',
    mark: '聚',
    color: '#5f6b40',
    description:
      '从发散切换到收敛模式。系统分析节点的语义相似度并提出聚拢建议，帮助你从混沌中发现隐藏模式。',
    principle: '格式塔知觉组织 · TF-IDF 相似度',
    actions: ['切换到「Converge」', '点击「Cluster ideas」查看相近节点', '接受建议，把相近想法聚为一组'],
  },
  {
    id: 'converge',
    index: 4,
    phase: 'converge',
    title: '评估筛选',
    subtitle: 'Evaluate & Select',
    mark: '敛',
    color: '#8a4a3c',
    description:
      '切换到收敛模式，为每个想法打上"可行性"与"主题分类"标签，看板自动分组，帮你做结构化决策。',
    principle: '决策满意化 · 避免选择过载',
    actions: ['切换「收敛模式」', '为节点标记可行性 / 主题', '收敛看板按标签分组浏览'],
  },
  {
    id: 'export',
    index: 5,
    phase: 'output',
    title: '精选导出',
    subtitle: 'Select & Export',
    mark: '出',
    color: '#a8443a',
    description:
      '勾选真正值得做的想法，一键导出为 Markdown 清单。让发散最终收敛为可执行的产出，而不是停在画布上。',
    principle: '工作记忆向长期沉淀转译',
    actions: ['在收敛看板勾选精选节点', '一键导出为 Markdown', '直接交付给团队 / 下一步'],
  },
];

// 双钻石隐喻：前两步发散，后三步收敛、评估与输出。
export const WORKFLOW_OVERVIEW = {
  divergeLabel: '发散 · 打开',
  convergeLabel: '收敛 · 聚焦',
  corePromise: '画布不只是记录空间，更是一位会主动介入的「创意教练」',
};
