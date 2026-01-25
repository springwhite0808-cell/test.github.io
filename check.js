<script>
    window.onerror = function(msg, url, line, col, error) {
        alert(`Error: ${msg}\nLine: ${line}\nCol: ${col}`);
    };
    const { createApp, ref, onMounted, nextTick, computed } = Vue;

    createApp({
        setup() {
            const currentView = ref('dashboard');
            const isSearching = ref(false);
            const searchQuery = ref('');
            const showCompanyDetail = ref(false);
            const currentCompany = ref({});
            const companyTab = ref('basic');
            const companyHistory = ref([]); // Added for history tracking
            const isGeneratingOutline = ref(false); // Added for AI generation state
            const reqSearch = ref('');
            const reqFilter = ref('all');
            const showReqModal = ref(false);
            const showSmartQA = ref(false);
            const showOutlineEditor = ref(false);
            const outlineTab = ref('req'); // req, company, templates
            const newReqForm = ref({
                title: '',
                company: '',
                priority: 'Medium',
                source: '',
                remarks: ''
            });
            const showMarginalModal = ref(false);
            const showMissedQuestionsModal = ref(false);
            const showOutcomeDetail = ref(false);
            const currentOutcome = ref({}); 
            // Mock Outcome for Demo
            const mockOutcome = {
                title: '比亚迪2025年度调研 (示例)',
                date: '2026-01-15',
                researcher: '张研究员',
                summary: '高端化战略成效显著，仰望U8订单超预期，预计2026年将贡献15%的毛利增量。海外建厂进度符合预期。',
                transcript: [
                    { role: 'me', text: '请问仰望U8目前的订单情况如何？' },
                    { role: 'other', text: '订单非常火爆，目前的交付周期大约在3-4个月。' },
                    { role: 'me', text: '对于2026年的毛利率趋势怎么看？' },
                    { role: 'other', text: '我们预计会稳中有升，主要是高端车型占比提升带来的结构性优化。' }
                ],
                questions: [
                    { text: '高端车型订单与交付情况？', done: true },
                    { text: '2026年毛利率展望？', done: true }
                ]
            };
            const transcriptContainer = ref(null);
            const currentExecutionReqId = ref(null);
            
            // Smart QA Refs
            const qaMessages = ref([
                { role: 'bot', content: '您好，我是您的智能投研助手。关于这家公司，您想了解什么？' }
            ]);
            const qaInput = ref('');
            const isQaLoading = ref(false);
            const isUpdatingInfo = ref(false);
            
            // Templates
            const templates = ref([
                { id: 't1', title: '新能源汽车常规调研', icon: 'zap', color: 'text-blue-600', bg: 'bg-blue-50', type: 'ev' },
                { id: 't2', title: '年度业绩说明会', icon: 'pie-chart', color: 'text-orange-600', bg: 'bg-orange-50', type: 'finance' },
                { id: 't3', title: '管理层变动评估', icon: 'users', color: 'text-purple-600', bg: 'bg-purple-50', type: 'management' },
                { id: 't4', title: '供应链涨价影响', icon: 'trending-up', color: 'text-red-600', bg: 'bg-red-50', type: 'supply' }
            ]);

            // Mock Companies (Real Data)
            const companies = ref([
                { 
                    name: '比亚迪', code: '002594', industry: '新能源汽车', city: '深圳', pe: '21.5', marketCap: '7,500亿',
                    revenue: '6,023.15亿 (+42.0%)', profit: '300.41亿 (+80.7%)',
                    desc: '全球新能源汽车领导者，拥有刀片电池、DM-i超级混动等核心技术。',
                    history: [
                        { title: '2025年度业绩调研', date: '2026-01-15', researcher: '张研究员', type: '现场调研' },
                        { title: 'Q3 经营情况交流', date: '2025-10-20', researcher: '李基金经理', type: '电话会议' }
                    ],
                    marginal: [
                        { title: '海外建厂加速', content: '匈牙利工厂预计2025投产，规避欧盟关税风险。', date: '2026-01-20', type: 'positive' },
                        { title: '高端化受阻', content: '仰望系列Q4销量略低于预期，市场竞争加剧。', date: '2026-01-15', type: 'negative' }
                    ]
                },
                { 
                    name: '宁德时代', code: '300750', industry: '动力电池', city: '宁德', pe: '18.2', marketCap: '8,200亿',
                    revenue: '4,009.17亿 (+22.0%)', profit: '441.21亿 (+43.6%)',
                    desc: '全球领先的动力电池系统提供商，麒麟电池、神行电池技术领先。',
                    marginal: [
                        { title: '原材料成本下降', content: '碳酸锂价格持续低位，电池毛利率修复至28%。', date: '2026-01-18', type: 'positive' }
                    ]
                },
                { 
                    name: '隆基绿能', code: '601012', industry: '光伏设备', city: '西安', pe: '12.8', marketCap: '1,800亿',
                    revenue: '1,200.5亿 (+0.3%)', profit: '100.2亿 (-27.0%)',
                    desc: '单晶硅片和组件龙头，BC电池技术路线坚定推动者。',
                    marginal: [
                        { title: '产能过剩压力', content: '产业链价格战持续，组件价格跌破0.8元/W。', date: '2026-01-10', type: 'negative' }
                    ]
                },
                { name: '贵州茅台', code: '600519', industry: '白酒', city: '仁怀', pe: '25.5', marketCap: '21,000亿', revenue: '1,500亿 (+18%)', profit: '750亿 (+19%)', desc: '高端白酒龙头，具备极强品牌护城河。' },
                { name: '迈瑞医疗', code: '300760', industry: '医疗器械', city: '深圳', pe: '30.2', marketCap: '3,500亿', revenue: '350亿 (+20%)', profit: '110亿 (+20%)', desc: '中国医疗器械龙头，海外市场拓展顺利。' },
                { name: '立讯精密', code: '002475', industry: '消费电子', city: '东莞', pe: '20.6', marketCap: '2,300亿', revenue: '2,500亿 (+15%)', profit: '110亿 (+18%)', desc: '精密制造龙头，深度绑定苹果产业链。' },
            ]);
            
            const filteredCompanies = computed(() => {
                if (!searchQuery.value) return companies.value;
                const q = searchQuery.value.toLowerCase();
                return companies.value.filter(c => 
                    c.name.includes(q) || c.code.includes(q) || c.industry.includes(q)
                );
            });


            // Mock Data
            const requirements = ref([
                { id: 'REQ001', title: '比亚迪新车型调研', company: '比亚迪', priority: 'High', status: '准备中', source: '晨会' },
                { id: 'REQ002', title: '宁德时代电池技术', company: '宁德时代', priority: 'Medium', status: '待处理', source: '基金经理' },
                { id: 'REQ003', title: '隆基绿能光伏组件', company: '隆基绿能', priority: 'High', status: '已完成', source: '个人关注' },
            ]);

            const filteredRequirements = computed(() => {
                return requirements.value.filter(req => {
                    const matchesSearch = req.title.includes(reqSearch.value) || req.company.includes(reqSearch.value);
                    const matchesFilter = reqFilter.value === 'all' || req.status === reqFilter.value;
                    return matchesSearch && matchesFilter;
                });
            });

            const submitNewReq = () => {
                if (!newReqForm.value.title || !newReqForm.value.company) {
                    alert('请填写必填项');
                    return;
                }
                if (newReqForm.value.id) {
                    // Edit mode
                    const idx = requirements.value.findIndex(r => r.id === newReqForm.value.id);
                    if (idx !== -1) {
                        requirements.value[idx] = { ...requirements.value[idx], ...newReqForm.value };
                    }
                } else {
                    // Create mode
                    requirements.value.unshift({
                        id: `REQ${Math.floor(Math.random() * 10000)}`,
                        title: newReqForm.value.title,
                        company: newReqForm.value.company,
                        priority: newReqForm.value.priority,
                        status: '待处理',
                        source: newReqForm.value.source
                    });
                }
                showReqModal.value = false;
                // Reset form
                newReqForm.value = { title: '', company: '', priority: 'Medium', source: '', remarks: '' };
            };

            const editReq = (req) => {
                newReqForm.value = { ...req, remarks: '' }; // Clone to form
                showReqModal.value = true;
            };

            const toggleSettings = () => {
                alert('设置功能正在开发中...');
            };

            const toggleNotifications = () => {
                alert('暂无新消息');
            };

            // Mock Recent Outlines
            const recentOutlines = ref([
                { id: 1, title: '比亚迪2025Q1业绩前瞻', type: '空白创建', date: '2026-01-20' },
                { id: 2, title: '光伏行业产能出清调研', type: '模板广场', date: '2026-01-18' }
            ]);

            const selectCompany = (company) => {

                currentCompany.value = company;
                showCompanyDetail.value = true;
                companyTab.value = 'basic';
            };

            const backToLibrary = () => {
                showCompanyDetail.value = false;
                searchQuery.value = '';
            };

            const performSearch = () => {
                if (!searchQuery.value) return;
                isSearching.value = true;
                // Simulate search delay
                setTimeout(() => {
                    isSearching.value = false;
                    // Mock search logic: if query matches '比亚迪', show detail, else alert
                    if (searchQuery.value.includes('比亚迪') || searchQuery.value.includes('002594')) {
                         selectCompany(companies.value[0]);
                    } else {
                        // Simple filter for demo
                        const found = companies.value.find(c => c.name.includes(searchQuery.value) || c.code.includes(searchQuery.value));
                        if (found) {
                            selectCompany(found);
                        } else {
                            alert('未找到该公司，请尝试搜索“比亚迪”或“宁德时代”');
                        }
                    }
                }, 600);
            };

            const createResearchFromCompany = () => {
                // If create from company, pre-fill company
                outlineForm.value.company = currentCompany.value.name ? `${currentCompany.value.name} (${currentCompany.value.code})` : '比亚迪 (002594)';
                switchView('outline');
                // Directly go to editor or let user choose? 
                // Let's go to landing page, but maybe pre-set context? 
                // For simplicity, just switch view
            };

            const startOutline = (type, templateType) => {
                if (type === 'blank') {
                    outlineForm.value.title = '';
                    outlineForm.value.company = '';
                    outlineForm.value.questions = [{ priority: 'P1', category: '', content: '' }];
                    outlineTab.value = 'templates';
                    showOutlineEditor.value = true;
                } else if (type === 'template') {
                    // Pre-fill template
                    useTemplate(templateType || 'ev');
                    showOutlineEditor.value = true;
                } else if (type === 'ai') {
                    useTemplate('ai');
                    showOutlineEditor.value = true;
                } else if (type === 'marginal') {
                    showMarginalModal.value = true;
                }
                
                if (type !== 'marginal') {
                    nextTick(() => {
                        lucide.createIcons();
                    });
                }
            };

            const createOutlineFromReq = (req) => {
                try {
                    outlineForm.value.reqId = req.id;
                    outlineForm.value.title = req.title;
                    outlineForm.value.company = req.company;
                    outlineTab.value = 'req';
                    switchView('outline', false);
                    showOutlineEditor.value = true;
                    nextTick(() => {
                        lucide.createIcons();
                    });
                } catch (e) {
                    console.error('Error creating outline:', e);
                    alert('创建提纲失败: ' + e.message);
                }
            };

            const createMarginalOutline = () => {
                // Pre-fill company for marginal outline
                outlineForm.value.company = currentCompany.value.name || '比亚迪 (002594)';
                switchView('outline');
                setTimeout(() => {
                    showMarginalModal.value = true;
                }, 100);
            };

            const generateMarginalOutline = () => {
                showMarginalModal.value = false;
                outlineForm.value.title = '比亚迪边际追踪调研';
                outlineForm.value.questions = [
                    { priority: 'P0', category: '追踪', content: '上季度提到的海外工厂投产进度是否按计划进行？' },
                    { priority: 'P1', category: '对比', content: '与Q3相比，Q4的单车净利有何变化？' }
                ];
                showOutlineEditor.value = true;
                nextTick(() => {
                    lucide.createIcons();
                });
            };

            const finishResearch = () => {
                const missedHighPriority = executionQuestions.value.some(q => !q.done && (q.priority === 'P0' || q.priority === 'P1'));
                if (missedHighPriority) {
                    showMissedQuestionsModal.value = true;
                } else {
                    confirmFinishResearch();
                }
            };

            const toggleQuestionStatus = (idx) => {
                const q = executionQuestions.value[idx];
                q.done = !q.done;
                if (q.done) {
                    const now = new Date();
                    const m = now.getMinutes().toString().padStart(2, '0');
                    q.time = `${now.getHours()}:${m}`;
                }
            };

            const viewOutcome = (outcome) => {
                currentOutcome.value = outcome;
                showOutcomeDetail.value = true;
            };

            const annotateMessage = (idx) => {
                const msg = transcript.value[idx];
                const note = prompt('为这条消息添加批注:', '');
                if (note) {
                    msg.text += ` [批注: ${note}]`;
                }
            };

            // Outline Form
            const outlineForm = ref({
                reqId: null,
                title: '比亚迪新车型及海外市场拓展调研',
                company: '比亚迪 (002594)',
                questions: [
                    { priority: 'P0', category: '业务进展', content: '请问公司目前高端车型（如仰望系列）的订单情况如何？交付周期大概多久？' },
                    { priority: 'P1', category: '财务状况', content: '对于2026年的毛利率趋势，管理层有什么展望？' }
                ]
            });

            // Execution Data
            const isRecording = ref(true);
            const recordingSeconds = ref(924);
            const timerInterval = ref(null);
            
            const recordingTimer = computed(() => {
                const h = Math.floor(recordingSeconds.value / 3600).toString().padStart(2, '0');
                const m = Math.floor((recordingSeconds.value % 3600) / 60).toString().padStart(2, '0');
                const s = (recordingSeconds.value % 60).toString().padStart(2, '0');
                return `${h}:${m}:${s}`;
            });

            const outlineContextCompany = computed(() => {
                if (!outlineForm.value.company) return null;
                return companies.value.find(c => outlineForm.value.company.includes(c.name));
            });

            // Start timer initially if recording
            onMounted(() => {
                const mask = document.getElementById('loading-mask');
                if (mask) mask.style.display = 'none';
                lucide.createIcons();
                
                if (isRecording.value) {
                    timerInterval.value = setInterval(() => {
                        recordingSeconds.value++;
                    }, 1000);
                }
            });

            const executionQuestions = ref([
                { text: '高端车型订单情况', done: true, time: '02:15', priority: 'P0' },
                { text: '2026年毛利率展望', done: false, priority: 'P1' },
                { text: '海外建厂进度', done: false, priority: 'P1' }
            ]);
            
            const missedQuestions = computed(() => {
                return executionQuestions.value.filter(q => !q.done && (q.priority === 'P0' || q.priority === 'P1'));
            });

            const transcript = ref([
                { role: 'me', text: '请问目前仰望U8的交付周期大概是多久？订单排产情况如何？' },
                { role: 'other', text: '目前仰望U8的订单非常火爆，我们的交付周期大约在3-4个月左右。现在的月产能已经爬坡到了3000台。', verified: true, verificationNote: '符合此前公告的产能规划 (2025Q3公告)' }
            ]);
            const newAnnotation = ref('');

            // Navigation
            const switchView = (view, resetState = true) => {
                currentView.value = view;
                if (view === 'outline' && resetState) showOutlineEditor.value = false;
                if (view === 'company') {
                     if (!currentCompany.value.name) showCompanyDetail.value = false;
                }
                nextTick(() => {
                    lucide.createIcons();
                });
            };

            const navClass = (view) => {
                return currentView.value === view 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white';
            };

            const priorityClass = (p) => {
                const map = {
                    'High': 'bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-red-100',
                    'Medium': 'bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-orange-100',
                    'Low': 'bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-100',
                };
                return map[p] || '';
            };

            const statusClass = (s) => {
                const map = {
                    '待处理': 'text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-xs',
                    '准备中': 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium',
                    '已完成': 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-medium',
                };
                return map[s] || '';
            };

            const viewTitle = computed(() => {
                const map = {
                    'dashboard': '工作台',
                    'requirements': '调研需求管理',
                    'company': '公司库',
                    'outline': '提纲创建',
                    'execution': '调研执行',
                    'outcomes': '调研成果库'
                };
                return map[currentView.value];
            });

            const viewDescription = computed(() => {
                const map = {
                    'dashboard': '欢迎回来，查看您的今日日程与待办事项',
                    'requirements': '集中管理您的所有调研需求与计划',
                    'company': 'AI 驱动的公司信息查询与智能问答',
                    'outline': '快速生成结构化调研提纲',
                    'execution': '实时语音转写与智能数据验证',
                    'outcomes': '沉淀团队知识资产'
                };
                return map[currentView.value];
            });

            // Smart QA Logic
            const askAI = async () => {
                if (!qaInput.value.trim()) return;
                
                const userMsg = qaInput.value;
                qaMessages.value.push({ role: 'user', content: userMsg });
                qaInput.value = '';
                isQaLoading.value = true;
                
                nextTick(() => {
                    const container = document.getElementById('qa-container');
                    if (container) container.scrollTop = container.scrollHeight;
                });

                try {
                    // Inject Company Context
                    let systemContent = "你是一个专业的公募基金研究员，专注于公司库数据的智能问答。请简练、专业地回答用户关于公司基本面、财务数据或行业格局的问题。";
                    if (currentCompany.value && currentCompany.value.name) {
                        const context = JSON.stringify(currentCompany.value);
                        systemContent += `\n\n当前正在查看的公司数据上下文: ${context}\n请基于此上下文回答用户问题。`;
                    }

                    const response = await fetch('https://api.deepseek.com/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer sk-b112105ac9df46178fa007d3815b2219'
                        },
                        body: JSON.stringify({
                            model: "deepseek-chat",
                            messages: [
                                { role: "system", content: systemContent },
                                ...qaMessages.value.map(m => ({ role: m.role, content: m.content }))
                            ]
                        })
                    });

                    if (!response.ok) throw new Error('API request failed');
                    
                    const data = await response.json();
                    const botMsg = data.choices[0].message.content;
                    
                    qaMessages.value.push({ role: 'bot', content: botMsg.replace(/\n/g, '<br>') });

                } catch (error) {
                    console.error(error);
                    qaMessages.value.push({ role: 'bot', content: '抱歉，智能问答暂时无法连接，请稍后再试。' });
                } finally {
                    isQaLoading.value = false;
                    nextTick(() => {
                        const container = document.getElementById('qa-container');
                        if (container) container.scrollTop = container.scrollHeight;
                        lucide.createIcons();
                    });
                }
            };

            const updateBasicInfo = () => {
                isUpdatingInfo.value = true;
                setTimeout(() => {
                    isUpdatingInfo.value = false;
                    if (currentCompany.value) {
                        currentCompany.value.revenue = 'Updated: ' + currentCompany.value.revenue;
                        currentCompany.value.desc += ' [已同步最新工商信息]';
                        alert('已成功从外部数据源（天眼查/Wind）同步最新基本信息！');
                    }
                }, 1500);
            };

            const editOutline = (outline) => {
                outlineForm.value.title = outline.title;
                // Mock loading existing questions
                outlineForm.value.questions = [
                    { priority: 'P0', category: '核心', content: '（编辑模式）请补充核心问题...' },
                    { priority: 'P1', category: '财务', content: '营收增长的主要驱动力是什么？' }
                ];
                showOutlineEditor.value = true;
                nextTick(() => {
                    lucide.createIcons();
                });
            };

            // Actions
            // (Duplicates removed)

            const addQuestion = () => {
                outlineForm.value.questions.push({ priority: 'P1', category: '', content: '' });
            };

            const removeQuestion = (idx) => {
                outlineForm.value.questions.splice(idx, 1);
            };

            const useTemplate = async (type) => {
                if (type === 'ev') {
                    outlineForm.value.title = '新能源汽车常规调研';
                    outlineForm.value.questions = [
                        { priority: 'P0', category: '产能', content: '目前各工厂产能利用率如何？' },
                        { priority: 'P1', category: '供应链', content: '原材料成本波动对毛利率的影响？' }
                    ];
                } else if (type === 'finance') {
                    outlineForm.value.title = '2025年度业绩说明会';
                    outlineForm.value.questions = [
                        { priority: 'P0', category: '财务', content: '营收增长的主要驱动力是什么？' },
                        { priority: 'P0', category: '财务', content: '各项费用率是否还有优化空间？' }
                    ];
                } else if (type === 'management') {
                    outlineForm.value.title = '管理层变动评估调研';
                    outlineForm.value.questions = [
                        { priority: 'P0', category: '战略', content: '新任管理层的战略侧重点与此前有何不同？' },
                        { priority: 'P1', category: '治理', content: '管理层变动是否会影响核心技术团队的稳定性？' }
                    ];
                } else if (type === 'supply') {
                    outlineForm.value.title = '供应链涨价影响评估';
                    outlineForm.value.questions = [
                        { priority: 'P0', category: '成本', content: '近期原材料涨价对公司毛利率的具体影响幅度是多少？' },
                        { priority: 'P1', category: '应对', content: '公司目前有哪些成本转嫁或对冲机制（如长协单）？' }
                    ];
                } else if (type === 'ai') {
                    isGeneratingOutline.value = true;
                    outlineForm.value.questions = []; // Clear existing
                    const companyName = outlineForm.value.company || '目标公司';
                    
                    try {
                        const response = await fetch('https://api.deepseek.com/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer sk-b112105ac9df46178fa007d3815b2219'
                            },
                            body: JSON.stringify({
                                model: "deepseek-chat",
                                messages: [
                                    { 
                                        role: "system", 
                                        content: "你是一个专业的公募基金研究员。请生成一份调研提纲，返回纯JSON格式，不要包含Markdown标记。格式为: {\"title\": \"标题\", \"questions\": [{\"priority\": \"P0\", \"category\": \"分类\", \"content\": \"问题内容\"}]}" 
                                    },
                                    { 
                                        role: "user", 
                                        content: `请为${companyName}生成一份调研提纲，包含3-5个核心问题，关注业务增长、竞争格局和财务状况。` 
                                    }
                                ],
                                response_format: { type: "json_object" }
                            })
                        });

                        if (!response.ok) {
                        throw new Error(`API Error: ${response.status}`);
                    }

                    const data = await response.json();
                    let content;
                    try {
                        const rawContent = data.choices[0].message.content;
                        // Remove markdown code blocks if present
                        const jsonString = rawContent.replace(/```json\n?|\n?```/g, '').trim();
                        // Find the first { and last } to extract JSON object
                        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
                        content = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(jsonString);
                    } catch (e) {
                        console.error('JSON Parse Error:', e);
                        // Fallback if parsing fails but content might be there
                        content = {
                            title: `AI 生成：${companyName}专项调研`,
                            questions: []
                        };
                    }
                    
                    outlineForm.value.title = content.title || `AI 生成：${companyName}专项调研`;
                        outlineForm.value.questions = content.questions || [];
                        
                    } catch (error) {
                        console.error('AI Generation Error:', error);
                        alert(`AI 生成失败 (${error.message})，已切换为默认模板。`);
                        // Fallback
                        outlineForm.value.title = 'AI 生成：比亚迪专项调研 (离线模式)';
                        outlineForm.value.questions = [
                            { priority: 'P0', category: '战略', content: '基于过去三次调研，管理层对海外市场的态度有何变化？' },
                            { priority: 'P1', category: '竞争', content: '如何看待特斯拉近期降价对订单的影响？' }
                        ];
                    } finally {
                        isGeneratingOutline.value = false;
                        nextTick(() => {
                            lucide.createIcons();
                        });
                    }
                }
            };

            const submitOutline = () => {
                // Save to Recent Outlines
                const newOutline = {
                    id: Date.now(),
                    title: outlineForm.value.title,
                    type: '普通提纲',
                    date: new Date().toISOString().split('T')[0]
                };
                recentOutlines.value.unshift(newOutline);
                
                // Save to Company History (Outline Created)
                const companyName = outlineForm.value.company.split(' ')[0]; // Simple extract
                const company = companies.value.find(c => c.name.includes(companyName));
                if (company) {
                    if (!company.history) company.history = [];
                    company.history.unshift({
                        title: `提纲创建: ${outlineForm.value.title}`,
                        date: newOutline.date,
                        researcher: '我',
                        type: '提纲'
                    });
                }

                // Transfer data to execution module
                currentExecutionReqId.value = outlineForm.value.reqId;
                executionQuestions.value = outlineForm.value.questions.map(q => ({
                    text: q.content,
                    priority: q.priority,
                    done: false,
                    time: ''
                }));
                
                // Reset transcript and timer
                transcript.value = [{ role: 'me', text: '（调研开始，正在录音...）' }];
                isRecording.value = true;
                recordingSeconds.value = 0;
                
                if (timerInterval.value) clearInterval(timerInterval.value);
                timerInterval.value = setInterval(() => {
                    recordingSeconds.value++;
                }, 1000);

                alert('提纲已生成并保存至列表！即将跳转至调研执行页面。');
                setTimeout(() => {
                    switchView('execution');
                }, 1000);
            };

            const toggleRecording = () => {
                isRecording.value = !isRecording.value;
                if (isRecording.value) {
                    timerInterval.value = setInterval(() => {
                        recordingSeconds.value++;
                    }, 1000);
                } else {
                    clearInterval(timerInterval.value);
                }
            };

            const addAnnotation = () => {
                if (!newAnnotation.value) return;
                transcript.value.push({
                    role: 'me',
                    text: `(批注) ${newAnnotation.value}`,
                    verified: false
                });
                newAnnotation.value = '';
                // Scroll to bottom
                setTimeout(() => {
                    const el = document.querySelector('.overflow-auto.p-8.space-y-8');
                    if (el) el.scrollTop = el.scrollHeight;
                }, 100);
            };
            
            const confirmFinishResearch = () => {
                showMissedQuestionsModal.value = false;
                
                // Update Requirement Status if exists
                if (currentExecutionReqId.value) {
                    const reqIndex = requirements.value.findIndex(r => r.id === currentExecutionReqId.value);
                    if (reqIndex !== -1) {
                        requirements.value[reqIndex].status = '已完成';
                    }
                    currentExecutionReqId.value = null;
                }

                // Add to Company History with detailed data
                const now = new Date();
                const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                
                const newRecord = {
                    id: Date.now(),
                    title: '本次调研纪要归档',
                    date: dateStr,
                    researcher: '我',
                    type: '现场调研',
                    // Structured Data
                    transcript: [...transcript.value],
                    questions: [...executionQuestions.value],
                    summary: 'AI 自动生成的调研总结...'
                };
                
                companyHistory.value.unshift(newRecord);

                // Also update the specific company's history if we can identify it
                // For demo, we update the first company (BYD) or currentCompany
                if (currentCompany.value && currentCompany.value.history) {
                    currentCompany.value.history.unshift(newRecord);
                } else if (companies.value[0].history) {
                    companies.value[0].history.unshift(newRecord);
                }

                alert('调研已结束，录音、文字及结构化数据已自动归档至公司库。');
                // Redirect to company library history tab
                // Ensure we are viewing a company
                if (!currentCompany.value.name) currentCompany.value = companies.value[0];
                
                showCompanyDetail.value = true;
                companyTab.value = 'history';
                switchView('company');
            };

            return {
                requirements,
                outlineForm,
                executionQuestions,
                transcript,
                isRecording,
                recordingTimer,
                newAnnotation,
                searchQuery,
                isSearching,
                showCompanyDetail,
                currentCompany,
                
                navClass,
                priorityClass,
                statusClass,
                viewTitle,
                viewDescription,
                
                switchView,
                performSearch,
                createResearchFromCompany,
                addQuestion,
                removeQuestion,
                toggleQuestionStatus,
                useTemplate,
                submitOutline,
                toggleRecording,
                addAnnotation,

                // New exports
                companyTab,
                reqSearch,
                reqFilter,
                showReqModal,
                newReqForm,
                filteredRequirements,
                submitNewReq,
                createOutlineFromReq,
                showMarginalModal,
                createMarginalOutline,
                generateMarginalOutline,
                showMissedQuestionsModal,
                finishResearch,
                confirmFinishResearch,
                missedQuestions,
                showOutcomeDetail,
                viewOutcome,
                currentOutcome,
                mockOutcome,
                annotateMessage,
                
                // V3 exports
                companies,
                currentCompany,
                selectCompany,
                backToLibrary,
                showSmartQA,
                showOutlineEditor,
                startOutline,
                outlineTab,
                outlineContextCompany,

                // V4 exports
                editReq,
                recentOutlines,
                toggleSettings,
                toggleNotifications,
                currentView,
                filteredCompanies,
                transcriptContainer,
                companyHistory,
                isGeneratingOutline,

                // Missing Exports Fix
                qaMessages,
                qaInput,
                isQaLoading,
                askAI,
                isUpdatingInfo,
                updateBasicInfo,
                editOutline,
                templates
            };
        }
    }).mount('#app');
</script>
