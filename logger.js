const {
    app,
    dialog
} = require("electron");
const log = require("electron-log");
const fs = require("fs");
const path = require("path");
const dataCu = new Date();
const year = dataCu.getFullYear();
const month = (dataCu.getMonth() + 1).toString().padStart(2, '0'); // 确保月份为两位数
const day = dataCu.getDate().toString().padStart(2, '0'); // 确保日期为两位数
const fullDateName = year + "-" + month + "-" + day + ".log";
const logDir = path.join(path.dirname(app.getPath('exe')), 'logs');
try {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir); // 如果目录不存在，则创建
    }
} catch (error) {
    const response = dialog.showMessageBoxSync({
        type: 'error',
        title: '日志目录创建失败',
        message: `无法创建日志目录: ${logDir}`,
        detail: `错误信息: ${error.message}\n请以管理员账号运行程序，选择仅为自己安装，否则可能会导致程序无法正常运行或更新。`,
        buttons: ['退出', '继续运行'],
        defaultId: 0,
        cancelId: 1
    });
    if (response === 0) {
        app.quit();
    }
    log.error("Error occurred while creating log directory:", error);
}

log.transports.console.format = "{h}:{i}:{s} {text}";
log.transports.file.maxSize = 50 * 1024 * 1024;
const logPath = path.join(logDir, fullDateName);
log.transports.file.resolvePath = () => {
    return logPath;
};
const MAX_LOG_AGE_DAYS = 30;
function cleanUpLogs() {
    try {
        const files = fs.readdirSync(logDir);

        files.forEach(file => {
            if (file.endsWith('.log')) { // 只处理.log结尾的文件
                const filePath = path.join(logDir, file);
                const stats = fs.statSync(filePath);
                const now = new Date();
                const fileAgeDays = (now - stats.mtime) / (24 * 60 * 60 * 1000);

                if (fileAgeDays > MAX_LOG_AGE_DAYS) {
                    fs.unlinkSync(filePath);
                    log.info(`Deleted expired log file: ${filePath}`);
                }
            }
        });
    } catch (err) {
        log.error("Error occurred while cleaning up logs:", err);
    }
}
module.exports = {
    log,
    logPath,
    cleanUpLogs
}