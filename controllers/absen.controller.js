const { Absen } = require('../models'); // Menggunakan model Absen 
const { Op } = require('sequelize');

/** Get attendance history for a user */
exports.getAbsenHistory = async (request, response) => {
    const userId = request.params.id; // Mendapatkan id_user dari parameter URL

    try {
        // Mengambil semua absensi yang sesuai dengan userId
        const absens = await Absen.findAll({
            where: { id_user: userId }, // Memfilter berdasarkan id_user
            order: [['date', 'DESC']]  // Menampilkan hasil berdasarkan tanggal terbaru
        });

        if (absens.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'No attendance records found for this user'
            });
        }

        return response.json({
            success: true,
            data: absens,
            message: 'Attendance history fetched successfully'
        });

    } catch (error) {
        console.error('Error fetching attendance history:', error);
        return response.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/** Get all attendance data */
exports.getAllAbsen = async (request, response) => {
    try {
        const absens = await Absen.findAll(); // Mengambil semua data absensi
        return response.json({
            success: true,
            data: absens,
            message: 'All attendance records have been loaded'
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/** Filter attendance records */
exports.findAbsen = async (request, response) => {
    const { keyword } = request.body;

    try {
        const absens = await Absen.findAll({
            where: {
                [Op.or]: [
                    { status: { [Op.substring]: keyword } },
                    { date: { [Op.substring]: keyword } },
                    { time: { [Op.substring]: keyword } }
                ]
            }
        });
        return response.json({
            success: true,
            data: absens,
            message: 'Attendance records have been filtered'
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/** Add new attendance record */
exports.addAbsen = async (request, response) => {
    const { id_user, date, time, status } = request.body;

    try {
        let newAbsen = {
            id_user,
            date,
            time,
            status,
        };

        const result = await Absen.create(newAbsen); // Menambahkan absensi baru
        return response.json({
            success: true,
            data: result,
            message: 'New attendance record has been added'
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/** Update attendance data */
exports.updateAbsen = async (request, response) => {
    const { date, time, status } = request.body;
    const absenId = request.params.id;

    try {
        let dataToUpdate = { date, time, status };

        const result = await Absen.update(dataToUpdate, { where: { id_presensi: absenId } });
        if (result[0] === 0) {
            return response.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        return response.json({
            success: true,
            message: 'Attendance record has been updated'
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/** Delete attendance record */
exports.deleteAbsen = async (request, response) => {
    const absenId = request.params.id;

    try {
        const result = await Absen.destroy({ where: { id_presensi: absenId } });
        if (result === 0) {
            return response.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        return response.json({
            success: true,
            message: 'Attendance record has been deleted'
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/** Function to get summary of attendance */
exports.getSummary = async (req, res) => {
    try {
        const absens = await Absen.findAll(); // Atau filter berdasarkan status, tanggal, dll.

        // Count attendance status
        const summary = {
            hadir: absens.filter(absen => absen.status === 'hadir').length,
            izin: absens.filter(absen => absen.status === 'izin').length,
            sakit: absens.filter(absen => absen.status === 'sakit').length,
            alpha: absens.filter(absen => absen.status === 'alpha').length,
        };

        return res.json({
            success: true,
            data: summary,
            message: 'Attendance summary successfully fetched'
        });
    } catch (error) {
        console.error('Error fetching attendance summary:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/** Analyze attendance based on date range and group by category (e.g., siswa or karyawan) */
exports.postAnalysis = async (req, res) => {
    const { start_date, end_date, group_by } = req.body; // Ambil data dari request body

    if (!start_date || !end_date || !group_by) {
        return res.status(400).json({
            status: "error",
            message: 'start_date, end_date, and group_by are required'
        });
    }

    try {
        // Menyusun filter untuk tanggal dan kategori
        const whereConditions = {
            date: {
                [Op.between]: [start_date, end_date], // Rentang tanggal
            },
        };

        // Ambil data absensi yang sesuai dengan filter
        const absens = await Absen.findAll({
            where: whereConditions
        });

        if (absens.length === 0) {
            return res.status(404).json({
                status: "error",
                message: 'No attendance records found for the given criteria'
            });
        }

        // Grouping data based on the 'group_by' category (e.g., "kelas", "jabatan", etc.)
        const groupedData = absens.reduce((acc, absen) => {
            const group = absen[group_by]; // Grouping by the given group_by field
            if (!acc[group]) {
                acc[group] = {
                    group: group,
                    total_users: 0,
                    total_attendance: {
                        hadir: 0,
                        izin: 0,
                        sakit: 0,
                        alpha: 0
                    }
                };
            }

            acc[group].total_users += 1; // Increment the total users in that group

            // Count attendance status
            switch (absen.status) {
                case 'hadir':
                    acc[group].total_attendance.hadir += 1;
                    break;
                case 'izin':
                    acc[group].total_attendance.izin += 1;
                    break;
                case 'sakit':
                    acc[group].total_attendance.sakit += 1;
                    break;
                case 'alpha':
                    acc[group].total_attendance.alpha += 1;
                    break;
            }

            return acc;
        }, {});

        // Convert grouped data to an array
        const groupedAnalysis = Object.values(groupedData).map(group => {
            const totalAttendance = group.total_attendance;
            const total = totalAttendance.hadir + totalAttendance.izin + totalAttendance.sakit + totalAttendance.alpha;

            // Calculate percentages
            const attendanceRate = {
                hadir_percentage: (totalAttendance.hadir / total) * 100,
                izin_percentage: (totalAttendance.izin / total) * 100,
                sakit_percentage: (totalAttendance.sakit / total) * 100,
                alpa_percentage: (totalAttendance.alpha / total) * 100,
            };

            return {
                group: group.group,
                total_users: group.total_users,
                attendance_rate: attendanceRate,
                total_attendance: totalAttendance
            };
        });

        // Return the response with the required structure
        return res.json({
            status: "success",
            data: {
                analysis_period: {
                    start_date: start_date,
                    end_date: end_date
                },
                grouped_analysis: groupedAnalysis
            },
            message: 'Attendance analysis by period and group completed successfully'
        });

    } catch (error) {
        console.error('Error analyzing attendance:', error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};