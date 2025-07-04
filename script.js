document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.form-container');
    const alertForm = document.getElementById('alert-form');
    const rectificationForm = document.getElementById('rectification-form');

    const alertRiskLevel = document.getElementById('alert-risk-level');
    const alertDeadlineInput = document.getElementById('alert-deadline');
    const alertIdInput = document.getElementById('alert-id');
    const rectIdInput = document.getElementById('rect-id');
    const rectUrgency = document.getElementById('rect-urgency');
    const rectDeadlineInput = document.getElementById('rect-deadline');

    let alertEvidenceEditor;
    let rectEvidenceEditor;

    // --- Utility Functions ---
    const formatDateTimeLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const addHours = (date, h) => {
        const newDate = new Date(date);
        newDate.setHours(newDate.getHours() + h);
        return newDate;
    };

    const generateId = (prefix) => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        return `${prefix}-${year}${month}${day}-${random}`;
    };

    // --- Tab Switching Logic ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const targetFormId = tab.dataset.form;
            forms.forEach(form => {
                form.classList.toggle('hidden', form.id !== targetFormId);
            });
        });
    });

    // --- Deadline Calculation Logic ---
    const updateAlertDeadline = () => {
        const level = alertRiskLevel.value;
        const hoursToAdd = { high: 24, medium: 48, low: 72 };
        const deadline = addHours(new Date(), hoursToAdd[level] || 48);
        alertDeadlineInput.value = formatDateTimeLocal(deadline);
    };

    const updateRectificationDeadline = () => {
        const urgency = rectUrgency.value;
        const hoursToAdd = { high: 24, medium: 72, low: 168 };
        const deadline = addHours(new Date(), hoursToAdd[urgency] || 72);
        rectDeadlineInput.value = formatDateTimeLocal(deadline);
    };

    alertRiskLevel.addEventListener('change', updateAlertDeadline);
    rectUrgency.addEventListener('change', updateRectificationDeadline);

    // --- A4 Report Style ---
    const reportStyles = `
        <style>
            @page {
                size: A4;
                margin: 1.5cm;
            }
            body {
                font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f0f2f5;
            }
            .report-container {
                width: 21cm;
                min-height: 29.7cm;
                padding: 1.5cm;
                margin: 1cm auto;
                border: 1px solid #d9d9d9;
                background: #fff;
                box-shadow: 0 0 10px rgba(0,0,0,0.05);
                box-sizing: border-box;
            }
            .report-header {
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                border-bottom: 2px solid #000;
                padding-bottom: 15px;
                margin-bottom: 25px;
            }
            .report-header .logo {
                position: absolute;
                left: 0;
                height: 55px;
                width: 60px;
            }
            .header-title {
                text-align: center;
                flex-grow: 1;
            }
            .header-title h1 { font-size: 26px; margin: 0; font-weight: 600; }
            .header-title p { font-size: 14px; color: #595959; margin: 5px 0 0; }
            .report-section { margin-bottom: 25px; }
            .report-section h2 {
                font-size: 16px;
                background-color: #f2f2f2;
                padding: 8px 12px;
                border-left: 4px solid #1890ff;
                margin: 0 0 15px 0;
                font-weight: 600;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #d9d9d9;
            }
            th, td {
                border: 1px solid #d9d9d9;
                padding: 12px;
                text-align: left;
                font-size: 14px;
                vertical-align: top;
            }
            th {
                background-color: #fafafa;
                font-weight: 600;
                width: 100px;
                color: #000000;
            }
            td {
                background-color: #fff;
                color: #000000;
            }
            .pre-wrap { white-space: pre-wrap; word-wrap: break-word; }
            td .ql-editor { padding: 0; }
            td .ql-editor.ql-blank::before { left: 0; }
            td img { max-width: 100%; height: auto; display: block; border-radius: 4px; }
            .footer {
                text-align: right;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #f0f0f0;
                font-size: 14px;
                color: #8c8c8c;
            }
            .footer p { margin: 5px 0; }

            @media print {
                body { background-color: #fff; }
                .report-container {
                    width: 100%;
                    min-height: auto;
                    margin: 0;
                    padding: 0;
                    border: none;
                    box-shadow: none;
                }
            }
        </style>
    `;

    // --- Report Generation Logic ---
    const generateAlertReport = () => {
        const getElementValue = (id) => document.getElementById(id).value;
        const getSelectedText = (id) => {
            const select = document.getElementById(id);
            return select.options[select.selectedIndex].text;
        };

        const data = {
            id: getElementValue('alert-id'),
            theme: getElementValue('alert-theme'),
            riskLevel: getSelectedText('alert-risk-level'),
            senderDept: getElementValue('alert-sender-dept'),
            receiverGroup: getElementValue('alert-receiver-group'),
            receiverOwner: getElementValue('alert-receiver-owner'),
            receiverContact: getElementValue('alert-receiver-contact'),
            riskDescription: getElementValue('alert-risk-description'),
            impactScope: getElementValue('alert-impact-scope'),
            consequences: getElementValue('alert-consequences'),
            evidence: alertEvidenceEditor.root.innerHTML,
            measures: getElementValue('alert-measures'),
            responseTime: getElementValue('alert-response-time'),
            deadline: new Date(getElementValue('alert-deadline')).toLocaleString('zh-CN'),
            reference: getElementValue('alert-reference'),
            sendTime: new Date().toLocaleString('zh-CN')
        };

        const reportHtml = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>风险预警函 - ${data.id}</title>${reportStyles}</head><body><div class="report-container"><div class="report-header"><img src="icon.png" alt="公司图标" class="logo"><div class="header-title"><h1>风险预警函</h1><p>编号: ${data.id}</p></div></div><div class="report-section"><h2>基本信息</h2><table><tr><th>预警主题</th><td>${data.theme}</td></tr><tr><th>风险等级</th><td>${data.riskLevel}</td></tr><tr><th>发送部门</th><td>${data.senderDept}</td></tr><tr><th>接收项目组</th><td>${data.receiverGroup}</td></tr><tr><th>负责人</th><td>${data.receiverOwner}</td></tr><tr><th>联系方式</th><td>${data.receiverContact||`N/A`}</td></tr></table></div><div class="report-section"><h2>风险详情</h2><table><tr><th>风险描述</th><td class="pre-wrap">${data.riskDescription}</td></tr><tr><th>影响范围</th><td class="pre-wrap">${data.impactScope}</td></tr><tr><th>可能造成的后果</th><td class="pre-wrap">${data.consequences||`N/A`}</td></tr><tr><th>相关证据/日志</th><td>${data.evidence||`N/A`}</td></tr></table></div><div class="report-section"><h2>处置要求</h2><table><tr><th>建议措施</th><td class="pre-wrap">${data.measures}</td></tr><tr><th>响应时限</th><td>${data.responseTime}</td></tr><tr><th>截止时间</th><td>${data.deadline}</td></tr><tr><th>参考文档</th><td>${data.reference||`N/A`}</td></tr></table></div><div class="footer"><p>发送时间: ${data.sendTime}</p><p>${data.senderDept}</p></div></div></body></html>`;

        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(reportHtml);
        reportWindow.document.close();
    };

    const generateRectificationReport = () => {
        const getElementValue = (id) => document.getElementById(id).value;
        const getSelectedText = (id) => {
            const select = document.getElementById(id);
            return select.options[select.selectedIndex].text;
        };

        const data = {
            id: getElementValue('rect-id'),
            issueType: getSelectedText('rect-issue-type'),
            urgency: getSelectedText('rect-urgency'),
            senderDept: getElementValue('rect-sender-dept'),
            receiverGroup: getElementValue('rect-receiver-group'),
            receiverOwner: getElementValue('rect-receiver-owner'),
            receiverContact: getElementValue('rect-receiver-contact'),
            issueDescription: getElementValue('rect-issue-description'),
            discoveryTime: new Date(getElementValue('rect-discovery-time')).toLocaleString('zh-CN'),
            affectedSystem: getElementValue('rect-affected-system'),
            evidence: rectEvidenceEditor.root.innerHTML,
            riskAnalysis: getElementValue('rect-risk-analysis'),
            measures: getElementValue('rect-measures'),
            deadline: new Date(getElementValue('rect-deadline')).toLocaleString('zh-CN'),
            verifier: getElementValue('rect-verifier'),
            verificationMethod: getSelectedText('rect-verification-method'),
            sendTime: new Date().toLocaleString('zh-CN')
        };

        const reportHtml = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>整改通知单 - ${data.id}</title>${reportStyles}</head><body><div class="report-container"><div class="report-header"><img src="icon.png" alt="公司图标" class="logo"><div class="header-title"><h1>整改通知单</h1><p>编号: ${data.id}</p></div></div><div class="report-section"><h2>基本信息</h2><table><tr><th>问题类型</th><td>${data.issueType}</td></tr><tr><th>紧急程度</th><td>${data.urgency}</td></tr><tr><th>发送部门</th><td>${data.senderDept}</td></tr><tr><th>接收项目组</th><td>${data.receiverGroup}</td></tr><tr><th>负责人</th><td>${data.receiverOwner}</td></tr><tr><th>联系方式</th><td>${data.receiverContact||`N/A`}</td></tr></table></div><div class="report-section"><h2>问题详情</h2><table><tr><th>问题描述</th><td class="pre-wrap">${data.issueDescription}</td></tr><tr><th>发现时间</th><td>${data.discoveryTime}</td></tr><tr><th>涉及系统</th><td>${data.affectedSystem}</td></tr><tr><th>相关证据</th><td>${data.evidence||`N/A`}</td></tr><tr><th>风险分析</th><td class="pre-wrap">${data.riskAnalysis}</td></tr></table></div><div class="report-section"><h2>整改要求</h2><table><tr><th>整改措施</th><td class="pre-wrap">${data.measures}</td></tr><tr><th>截止时间</th><td>${data.deadline}</td></tr><tr><th>验证人</th><td>${data.verifier}</td></tr><tr><th>验证方式</th><td>${data.verificationMethod}</td></tr></table></div><div class="footer"><p>发送时间: ${data.sendTime}</p><p>${data.senderDept}</p></div></div></body></html>`;

        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(reportHtml);
        reportWindow.document.close();
    };

    // --- Form Event Listeners ---
    alertForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (alertForm.checkValidity()) {
            generateAlertReport();
        } else {
            alertForm.reportValidity();
        }
    });

    rectificationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (rectificationForm.checkValidity()) {
            generateRectificationReport();
        } else {
            rectificationForm.reportValidity();
        }
    });

    // --- Initialization ---
    const initializeForms = () => {
        tabs[0].classList.add('active');
        document.getElementById('alert-form').classList.remove('hidden');
        document.getElementById('rectification-form').classList.add('hidden');
        
        alertIdInput.value = generateId('YJ');
        rectIdInput.value = generateId('ZG');
        
        updateAlertDeadline();
        updateRectificationDeadline();
        
        const discoveryTimeInput = document.getElementById('rect-discovery-time');
        if (discoveryTimeInput) {
            discoveryTimeInput.value = formatDateTimeLocal(new Date());
        }

        const quillOptions = {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image']
                ]
            },
            placeholder: '请附上相关截图、日志、URL等证据信息'
        };

        alertEvidenceEditor = new Quill('#alert-evidence-editor', quillOptions);
        rectEvidenceEditor = new Quill('#rect-evidence-editor', quillOptions);
    };

    initializeForms();
});