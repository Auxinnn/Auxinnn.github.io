// NBA球队韧性指标前端应用

// 指标中文名映射
const INDICATOR_NAMES = {
    // 逆境表现维度
    'comeback_win_rate': '落后逆转胜率',
    'big_deficit_comeback_rate': '大比分落后逆转获胜率',
    'clutch_net_rating': '关键时刻净胜分差',
    'blown_lead_rate': '领先崩盘率',
    // 连续性与稳定性维度
    'bounce_back_performance': '连败后反弹能力',
    'back_to_back_performance': '背靠背比赛表现',
    'road_performance_consistency': '客场战绩稳定性',
    'losing_streak_length': '连败长度',
    // 阵容适应性维度
    'win_rate_without_key_players': '核心球员缺阵胜率',
    'starting_lineup_volatility': '首发更迭率',
    'star_dependency': '核心球员依赖度',
    // 心理韧性维度
    'performance_vs_top_teams': '强队对抗表现',
    'opp_hot_night_win_rate': '对手手感火热夜胜率',
    'post_tough_loss_nr': '惨败/惜败后反弹'
};

// 指标分类
const INDICATOR_CATEGORIES = {
    adversity: ['comeback_win_rate', 'big_deficit_comeback_rate', 'clutch_net_rating', 'blown_lead_rate'],
    consistency: ['bounce_back_performance', 'back_to_back_performance', 'road_performance_consistency', 'losing_streak_length'],
    lineup: ['win_rate_without_key_players', 'starting_lineup_volatility', 'star_dependency'],
    mental: ['performance_vs_top_teams', 'opp_hot_night_win_rate', 'post_tough_loss_nr']
};

// 全局变量
let currentData = null;
let currentSeason = '2023-24';

// DOM元素
const seasonSelect = document.getElementById('seasonSelect');
const refreshBtn = document.getElementById('refreshBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const tableBody = document.getElementById('tableBody');
const totalTeamsEl = document.getElementById('totalTeams');
const avgScoreEl = document.getElementById('avgScore');
const updateTimeEl = document.getElementById('updateTime');
const modal = document.getElementById('detailModal');
const modalTeamName = document.getElementById('modalTeamName');
const closeModal = document.querySelector('.close');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载数据
    loadData();
    
    // 事件监听
    seasonSelect.addEventListener('change', (e) => {
        currentSeason = e.target.value;
        loadData();
    });
    
    refreshBtn.addEventListener('click', () => {
        loadData();
    });
    
    closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// 加载数据
async function loadData() {
    try {
        showLoading(true);
        hideError();
        
        // 构建文件名
        const fileName = `resilience_scores_${currentSeason.replace('-', '_')}.json`;
        const filePath = `/output/${fileName}`;
        
        const response = await fetch(filePath);
        
        if (!response.ok) {
            throw new Error(`无法加载数据文件: ${fileName}`);
        }
        
        const data = await response.json();
        currentData = data;
        
        // 更新统计信息
        updateStats(data);
        
        // 渲染表格
        renderTable(data.teams);
        
        showLoading(false);
        
    } catch (error) {
        console.error('加载数据失败:', error);
        showError(`加载失败: ${error.message}。请确保已运行计算脚本生成数据文件。`);
        showLoading(false);
    }
}

// 显示/隐藏加载指示器
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.add('show');
    } else {
        loadingIndicator.classList.remove('show');
    }
}

// 显示错误消息
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

// 隐藏错误消息
function hideError() {
    errorMessage.classList.remove('show');
}

// 更新统计信息
function updateStats(data) {
    const teams = data.teams || [];
    
    totalTeamsEl.textContent = teams.length;
    
    if (teams.length > 0) {
        const avgScore = teams.reduce((sum, team) => sum + team.resilience_score, 0) / teams.length;
        avgScoreEl.textContent = avgScore.toFixed(2);
    } else {
        avgScoreEl.textContent = '-';
    }
    
    if (data.generated_at) {
        const date = new Date(data.generated_at);
        updateTimeEl.textContent = date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        updateTimeEl.textContent = '-';
    }
}

// 渲染表格
function renderTable(teams) {
    tableBody.innerHTML = '';
    
    if (!teams || teams.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">暂无数据</td></tr>';
        return;
    }
    
    teams.forEach(team => {
        const tr = document.createElement('tr');
        
        // 排名
        const rankTd = document.createElement('td');
        const rankSpan = document.createElement('span');
        rankSpan.className = 'rank';
        if (team.rank === 1) rankSpan.classList.add('top1');
        else if (team.rank === 2) rankSpan.classList.add('top2');
        else if (team.rank === 3) rankSpan.classList.add('top3');
        rankSpan.textContent = team.rank;
        rankTd.appendChild(rankSpan);
        
        // 球队名
        const teamTd = document.createElement('td');
        const teamSpan = document.createElement('span');
        teamSpan.className = 'team-name';
        teamSpan.textContent = team.team_name;
        teamTd.appendChild(teamSpan);
        
        // 得分
        const scoreTd = document.createElement('td');
        scoreTd.className = 'score';
        const scoreValue = document.createElement('div');
        scoreValue.className = 'score-value';
        scoreValue.textContent = team.resilience_score.toFixed(2);
        const scoreBar = document.createElement('div');
        scoreBar.className = 'score-bar';
        const scoreFill = document.createElement('div');
        scoreFill.className = 'score-fill';
        scoreFill.style.width = `${team.resilience_score}%`;
        scoreBar.appendChild(scoreFill);
        scoreTd.appendChild(scoreValue);
        scoreTd.appendChild(scoreBar);
        
        // 操作
        const actionsTd = document.createElement('td');
        actionsTd.style.textAlign = 'center';
        const detailBtn = document.createElement('button');
        detailBtn.className = 'detail-btn';
        detailBtn.textContent = '查看详情';
        detailBtn.addEventListener('click', () => showDetail(team));
        actionsTd.appendChild(detailBtn);
        
        tr.appendChild(rankTd);
        tr.appendChild(teamTd);
        tr.appendChild(scoreTd);
        tr.appendChild(actionsTd);
        
        tableBody.appendChild(tr);
    });
}

// 显示球队详情
function showDetail(team) {
    modalTeamName.textContent = `${team.team_name} - 详细指标`;
    
    // 清空之前的内容
    document.getElementById('adversityIndicators').innerHTML = '';
    document.getElementById('consistencyIndicators').innerHTML = '';
    document.getElementById('lineupIndicators').innerHTML = '';
    document.getElementById('mentalIndicators').innerHTML = '';
    
    // 填充各维度指标
    fillIndicators('adversityIndicators', team.indicators, INDICATOR_CATEGORIES.adversity);
    fillIndicators('consistencyIndicators', team.indicators, INDICATOR_CATEGORIES.consistency);
    fillIndicators('lineupIndicators', team.indicators, INDICATOR_CATEGORIES.lineup);
    fillIndicators('mentalIndicators', team.indicators, INDICATOR_CATEGORIES.mental);
    
    // 显示模态框
    modal.classList.add('show');
}

// 填充指标数据
function fillIndicators(containerId, indicators, indicatorKeys) {
    const container = document.getElementById(containerId);
    
    indicatorKeys.forEach(key => {
        if (indicators.hasOwnProperty(key)) {
            const div = document.createElement('div');
            div.className = 'indicator-item';
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'indicator-name';
            nameDiv.textContent = INDICATOR_NAMES[key] || key;
            
            const valueDiv = document.createElement('div');
            valueDiv.className = 'indicator-value';
            const value = indicators[key];
            
            // 格式化数值
            if (typeof value === 'number') {
                if (key.includes('rate') || key.includes('ratio')) {
                    valueDiv.textContent = (value * 100).toFixed(2) + '%';
                } else if (key.includes('rating') || key.includes('diff') || key.includes('score')) {
                    valueDiv.textContent = value.toFixed(2);
                } else {
                    valueDiv.textContent = value.toFixed(3);
                }
            } else {
                valueDiv.textContent = value;
            }
            
            div.appendChild(nameDiv);
            div.appendChild(valueDiv);
            container.appendChild(div);
        }
    });
    
    // 如果没有数据
    if (container.children.length === 0) {
        container.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">暂无数据</p>';
    }
}

