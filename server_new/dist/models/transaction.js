"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const block_1 = require("./block");
let Transaction = class Transaction extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Transaction.prototype, "height", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Transaction.prototype, "hash", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Transaction.prototype, "action", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => block_1.default),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Transaction.prototype, "block_id", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => block_1.default),
    __metadata("design:type", block_1.default)
], Transaction.prototype, "block", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Transaction.prototype, "code", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Transaction.prototype, "success", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Transaction.prototype, "log", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Transaction.prototype, "gas_wanted", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Transaction.prototype, "gas_used", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Transaction.prototype, "from_address", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Transaction.prototype, "to_address", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Transaction.prototype, "sender_id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Transaction.prototype, "recipient_id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Transaction.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Transaction.prototype, "amount", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Transaction.prototype, "raw", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Transaction.prototype, "dispatched_at", void 0);
Transaction = __decorate([
    sequelize_typescript_1.DefaultScope(() => ({ attributes: { exclude: ['id'] } })),
    sequelize_typescript_1.Table({
        tableName: 'transactions',
        underscored: true,
        timestamps: true
    })
], Transaction);
exports.default = Transaction;
//# sourceMappingURL=transaction.js.map