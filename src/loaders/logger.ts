import winston from "winston";
import winstonDaily from "winston-daily-rotate-file";

const SlackHook = require("winston-slack-webhook-transport");
const transports = [];

transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.cli(),
      winston.format.splat()
    ),
  })
);

transports.push(
  new winstonDaily({
    level: "warn",
    datePattern: "YYYY-MM-DD",
    dirname: "logs/error", // error.log 파일은 /logs/error 하위에 저장
    filename: `%DATE%.error.log`,
    maxFiles: 60,
    zippedArchive: true,
  })
);

if (process.env.NODE_ENV != "local") {
  transports.push(
    new SlackHook({
      level: "error",
      webhookUrl:
        "https://hooks.slack.com/services/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",
      formatter: (info) => {
        return {
          text: process.env.NODE_ENV,
          attachments: [
            {
              text: info.level + ":" + info.message,
            },
          ],
        };
      },
    })
  );
}

const LoggerInstance = winston.createLogger({
  level: process.env.NODE_ENV == "live" ? "error" : "info",
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports,
});

export default LoggerInstance;
