module.exports = {
    default: {
        requireModule: [
            "ts-node/register"
        ],
        require: [
            "src/support/world.ts",
            "src/step-definitions/**/*.ts",
        ],
        paths: ["src/features/**/*.feature"],
        format: [
            "progress",
            "json:test-output/reports/cucumber-report.json",
            "html:test-output/reports/cucumber-report.html"
        ]
    }
};
