'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = (sequelize, DataTypes) => {
    const Absen = sequelize.define('Absen', {
        id_presensi: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'presensi_user',  // The name of the table referenced
                key: 'id_user'           // The primary key of the referenced table
            },
            onDelete: 'CASCADE',           // Optional: Defines behavior when a user is deleted
            onUpdate: 'CASCADE'           // Optional: Defines behavior when user ID is updated
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('hadir', 'izin', 'sakit', 'alpha'),
            allowNull: false
        }
    }, {
        tableName: 'presensi_absen',
        timestamps: true // Menyediakan kolom createdAt dan updatedAt
    });

    Absen.associate = function(models) {
        // Relasi dengan tabel User
        Absen.belongsTo(models.User, {
            foreignKey: 'id_user',   // Foreign key in the Absen model
            as: 'user'               // Alias for the association
        });
    };

    return Absen;
};
