const fs = require("fs");

class database {
    constructor(filePath) {
        this.filePath = filePath;
        this.data = this.loadData();
    }

    loadData() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch {
            return {};
        }
    }

    saveData() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf8");
    }

    set(key, value) {
        this.data[key] = value;
        this.saveData();
    }

    has(key) {
        return key in this.data;
    }

    get(key) {
        return this.data[key];
    }

    push(key, value) {
        this.data[key] = this.data[key] || [];
        this.data[key].push(value);
        this.saveData();
    }

    pull(key, value) {
        if (Array.isArray(this.data[key])) {
            this.data[key] = this.data[key].filter((el) => el !== value);
            this.saveData();
        }
    }

    slice(key, start, end = undefined) {
        if (Array.isArray(this.data[key])) {
            this.data[key] = this.data[key].slice(start, end);
            this.saveData();
        }
    }

    find(key, value) {
        return this.data[key]?.find(el => el === value) || undefined;
    }

    delete(key) {
        if (this.has(key)) {
            delete this.data[key];
            this.saveData();
        }
    }

    all() {
        return this.data;
    }
}

module.exports = database;