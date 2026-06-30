/**
 * 主页交互脚本
 * 处理玩法说明弹窗的显示与隐藏
 */

// DOM 元素引用
const ruleModal = document.getElementById('rule-modal');
const showRulesBtn = document.getElementById('show-rules-btn');
const closeRuleBtn = document.getElementById('rule-close');

/**
 * 打开玩法说明弹窗
 */
function openRuleModal() {
    if (!ruleModal) return;
    ruleModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // 禁止背景滚动
}

/**
 * 关闭玩法说明弹窗
 */
function closeRuleModal() {
    if (!ruleModal) return;
    ruleModal.style.display = 'none';
    document.body.style.overflow = ''; // 恢复背景滚动
}

// 绑定点击事件：打开弹窗
if (showRulesBtn) {
    showRulesBtn.addEventListener('click', openRuleModal);
}

// 绑定点击事件：关闭按钮
if (closeRuleBtn) {
    closeRuleBtn.addEventListener('click', closeRuleModal);
}

// 点击弹窗外的区域关闭弹窗
if (ruleModal) {
    ruleModal.addEventListener('click', (e) => {
        if (e.target === ruleModal) {
            closeRuleModal();
        }
    });
}

// 按 ESC 键关闭弹窗
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ruleModal && ruleModal.style.display === 'flex') {
        closeRuleModal();
    }
});
