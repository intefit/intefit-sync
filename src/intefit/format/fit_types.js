'use strict';
define([], function () {

    // Based on FitSDKRelease_14.20/java/com/garmin/fit/*

    var Fit = {
        MAX_FIELD_SIZE: 255,

        FIELD_NUM_INVALID: 255,
        FIELD_NUM_MESSAGE_INDEX: 254,
        FIELD_NUM_TIMESTAMP: 253,

        SUBFIELD_INDEX_ACTIVE_SUBFIELD: 65534,
        SUBFIELD_INDEX_MAIN_FIELD: 65535,
        SUBFIELD_NAME_MAIN_FIELD: "",

        BASE_TYPE_ENDIAN_FLAG: 0x80,
        BASE_TYPE_RESERVED: 0x60,
        BASE_TYPE_NUM_MASK: 0x1F,

        ENUM_INVALID: 0xFF,
        BASE_TYPE_ENUM: 0x00,
        SINT8_INVALID: 0x7F,
        BASE_TYPE_SINT8: 0x01,
        UINT8_INVALID: 0xFF,
        BASE_TYPE_UINT8: 0x02,
        SINT16_INVALID: 0x7FFF,
        BASE_TYPE_SINT16: 0x83,
        UINT16_INVALID: 0xFFFF,
        BASE_TYPE_UINT16: 0x84,
        SINT32_INVALID: 0x7FFFFFFF,
        BASE_TYPE_SINT32: 0x85,
        UINT32_INVALID: 0xFFFFFFFF,
        BASE_TYPE_UINT32: 0x86,
        STRING_INVALID: "",
        BASE_TYPE_STRING: 0x07,
        FLOAT32_INVALID: 0xFFFFFFFF,
        BASE_TYPE_FLOAT32: 0x88,
        FLOAT64_INVALID: 0xFFFFFFFFFFFFFFFF,
        BASE_TYPE_FLOAT64: 0x89,
        UINT8Z_INVALID: 0,
        BASE_TYPE_UINT8Z: 0x0A,
        UINT16Z_INVALID: 0,
        BASE_TYPE_UINT16Z: 0x8B,
        UINT32Z_INVALID: 0,
        BASE_TYPE_UINT32Z: 0x8C,
        BYTE_INVALID: 0xFF,
        BASE_TYPE_BYTE: 0x0D,
        baseTypeSizes: [1, 1, 1, 2, 2, 4, 4, 1, 2, 4, 1, 2, 4, 1]
    };

    var FitTypes = {};

    FitTypes.messageTypes = {};

    var MesgNum = {
        FILE_ID: 0,
        CAPABILITIES: 1,
        DEVICE_SETTINGS: 2,
        USER_PROFILE: 3,
        HRM_PROFILE: 4,
        SDM_PROFILE: 5,
        BIKE_PROFILE: 6,
        ZONES_TARGET: 7,
        HR_ZONE: 8,
        POWER_ZONE: 9,
        MET_ZONE: 10,
        SPORT: 12,
        GOAL: 15,
        SESSION: 18,
        LAP: 19,
        RECORD: 20,
        EVENT: 21,
        DEVICE_INFO: 23,
        WORKOUT: 26,
        WORKOUT_STEP: 27,
        SCHEDULE: 28,
        WEIGHT_SCALE: 30,
        COURSE: 31,
        COURSE_POINT: 32,
        TOTALS: 33,
        ACTIVITY: 34,
        SOFTWARE: 35,
        FILE_CAPABILITIES: 37,
        MESG_CAPABILITIES: 38,
        FIELD_CAPABILITIES: 39,
        FILE_CREATOR: 49,
        BLOOD_PRESSURE: 51,
        SPEED_ZONE: 53,
        MONITORING: 55,
        TRAINING_FILE: 72,
        HRV: 78,
        LENGTH: 101,
        MONITORING_INFO: 103,
        PAD: 105,
        SLAVE_DEVICE: 106,
        CADENCE_ZONE: 131,
        MEMO_GLOB: 145,
        MFG_RANGE_MIN: 0xFF00, // 0xFF00 - 0xFFFE reserved for manufacturer specific messages
        MFG_RANGE_MAX: 0xFFFE, // 0xFF00 - 0xFFFE reserved for manufacturer specific messages
        INVALID: 0xFFFF
    };

    var Field = function (name, num, type, scale, offset, units, accumulated) {
        this.name = name;;
        this.num = num;
        this.type = type;
        this.scale = scale;
        this.offset = offset;
        this.units = units;
        this.isAccumulated = accumulated;
        this.values = [];
        this.components = [];
        this.subFields = [];
    };
    Field.prototype.getNumValues = function () {
        return values.size();
    };
    Field.prototype.getSize = function (field) {
        var size = 0;

        switch (type) {
            case Fit.BASE_TYPE_ENUM:
            case Fit.BASE_TYPE_UINT8:
            case Fit.BASE_TYPE_UINT8Z:
            case Fit.BASE_TYPE_SINT8:
            case Fit.BASE_TYPE_BYTE:
            case Fit.BASE_TYPE_SINT16:
            case Fit.BASE_TYPE_UINT16:
            case Fit.BASE_TYPE_UINT16Z:
            case Fit.BASE_TYPE_SINT32:
            case Fit.BASE_TYPE_UINT32:
            case Fit.BASE_TYPE_UINT32Z:
            case Fit.BASE_TYPE_FLOAT32:
            case Fit.BASE_TYPE_FLOAT64:
                size = this.getNumValues() * Fit.baseTypeSizes[type & Fit.BASE_TYPE_NUM_MASK];
                break;

            case Fit.BASE_TYPE_STRING:
                for (var valNo = 0;  valNo < this.values.length; valNo++) {
                    var value = this.values[valNo];
                    size += value.length + 1;
                    //size += value.toString().getBytes("UTF-8").length + 1;
                }
                break;

            default:
                break;
        }

        return size;
    };

    Field.prototype.getSubField = function (subFieldIndex) {
        if ((subFieldIndex >= 0) && (subFieldIndex < this.subFields.length))
            return this.subFields[subFieldIndex];
        else
            return null;
    };

    Field.prototype.getValueInternal = function (fieldArrayIndex, subFieldIndex) {
        var subField = this.getSubField(subFieldIndex);

        var value;
        var scale;
        var offset;

        if (fieldArrayIndex >= this.values.length)
            return null;

        if (subField == null) {
            scale = this.scale;
            offset = this.offset;
        } else {
            scale = subField.scale;
            offset = subField.offset;
        }

        value = this.values[fieldArrayIndex];

        switch (this.type) {
            case Fit.BASE_TYPE_ENUM:
                if (value === (Fit.ENUM_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_SINT8:
                if (value === (Fit.SINT8_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_UINT8:
                if (value === (Fit.UINT8_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_UINT8Z:
                if (value === (Fit.UINT8Z_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_SINT16:
                if (value === (Fit.SINT16_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_UINT16:
                if (value === (Fit.UINT16_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_UINT16Z:
                if (value === (Fit.UINT16Z_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_SINT32:
                if (value === (Fit.SINT32_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_UINT32:
                if (value === (Fit.UINT32_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_UINT32Z:
                if (value === (Fit.UINT32Z_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_FLOAT32:
                if (value === (Fit.FLOAT32_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_FLOAT64:
                if (value === (Fit.FLOAT64_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_BYTE:
                if (value === (Fit.BYTE_INVALID))
                    return null;
                break;
            default:
                break;
        }

        if ((scale != 1) || (offset != 0)) {
            //console.log(this.name+" = "+value+" / "+scale+ " "+offset+" = "+(value / scale - offset));
            return value / scale - offset;
        }

        return value;
    };

    Field.prototype.getString = function (fieldArrayIndex, subFieldIndex) {
        if (!fieldArrayIndex) fieldArrayIndex = 0;
        var value = this.getValueInternal(fieldArrayIndex, subFieldIndex);

        if (value == null)
            return null;

        switch (this.type) {
            case Fit.BASE_TYPE_ENUM:
                if (value === (Fit.ENUM_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_SINT8:
                if (value === (Fit.SINT8_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_UINT8:
                if (value === (Fit.UINT8_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_UINT8Z:
                if (value === (Fit.UINT8Z_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_SINT16:
                if (value === (Fit.SINT16_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_UINT16:
                if (value === (Fit.UINT16_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_UINT16Z:
                if (value === (Fit.UINT16Z_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_SINT32:
                if (value === (Fit.SINT32_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_UINT32:
                if (value === (Fit.UINT32_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_UINT32Z:
                if (value === (Fit.UINT32Z_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_FLOAT32:
                if (value === (Fit.FLOAT32_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_FLOAT64:
                if (value === (Fit.FLOAT64_INVALID))
                    return null;
                break;
            case Fit.BASE_TYPE_BYTE:
                if (value === (Fit.BYTE_INVALID))
                    return null;
                break;
            default:
                break;
        }

        if (this.units == 'deg') {
            value = value * (180/(0x80000000));
        }

        return value;
    };

    var Mesg = function (name, num) {
        this.num = num;
        this.name = name;
        this.fields = {};
        FitTypes.messageTypes[num] = this;
    };
    Mesg.prototype.addField = function (field) {
        this.fields[field.num] = field;
        return field;
    };

    var fileIdMesg = new Mesg("file_id", MesgNum.FILE_ID);
    fileIdMesg.addField(new Field("type", 0, 0, 1, 0, "", false));
    fileIdMesg.addField(new Field("manufacturer", 1, 132, 1, 0, "", false));
    fileIdMesg.addField(new Field("product", 2, 132, 1, 0, "", false));
    //fileIdMesg.fields.get(field_index).subFields.add(new SubField("garmin_product", 132, 1, 0, ""));
    //fileIdMesg.fields.get(field_index).subFields.get(subfield_index).addMap(1, 1);
    //fileIdMesg.fields.get(field_index).subFields.get(subfield_index).addMap(1, 15);
    //fileIdMesg.fields.get(field_index).subFields.get(subfield_index).addMap(1, 13);
    fileIdMesg.addField(new Field("serial_number", 3, 140, 1, 0, "", false));
    fileIdMesg.addField(new Field("time_created", 4, 134, 1, 0, "", false));
    fileIdMesg.addField(new Field("number", 5, 132, 1, 0, "", false));

    fileIdMesg.postParse = function (record) {
        switch (record.map['type'].raw) {
            case 1:
                record.fileTypeName = 'DEVICE';
                break;
            case 2:
                record.fileTypeName = 'SETTINGS';
                break;
            case 3:
                record.fileTypeName = 'SPORT';
                break;
            case 4:
                record.fileTypeName = 'ACTIVITY';
                break;
            case 5:
                record.fileTypeName = 'WORKOUT';
                break;
            case 6:
                record.fileTypeName = 'COURSE';
                break;
            case 7:
                record.fileTypeName = 'SCHEDULES';
                break;
            case 9:
                record.fileTypeName = 'WEIGHT';
                break;
            case 10:
                record.fileTypeName = 'TOTALS';
                break;
            case 11:
                record.fileTypeName = 'GOALS';
                break;
            case 14:
                record.fileTypeName = 'BLOOD_PRESSURE';
                break;
            case 15:
                record.fileTypeName = 'MONITORING_A';
                break;
            case 20:
                record.fileTypeName = 'ACTIVITY_SUMMARY';
                break;
            case 28:
                record.fileTypeName = 'MONITORING_DAILY';
                break;
            case 32:
                record.fileTypeName = 'MONITORING_B';
                break;
            case 0xF7:
                record.fileTypeName = 'MFG_RANGE_MIN';
                break;
            case 0xFE:
                record.fileTypeName = 'MFG_RANGE_MAX';
                break;
            case 0xFF:
                record.fileTypeName = 'INVALID';
                break;
        }
    };

    var fileCreatorMesg = new Mesg("file_creator", MesgNum.FILE_CREATOR);
    fileCreatorMesg.addField(new Field("software_version", 0, 132, 1, 0, "", false));
    fileCreatorMesg.addField(new Field("hardware_version", 1, 2, 1, 0, "", false));

    var eventMesg = new Mesg("event", MesgNum.EVENT);
    eventMesg.addField(new Field("timestamp", 253, 134, 1, 0, "s", false));
    eventMesg.addField(new Field("event", 0, 0, 1, 0, "", false));
    eventMesg.addField(new Field("event_type", 1, 0, 1, 0, "", false));
    eventMesg.addField(new Field("data16", 2, 132, 1, 0, "", false));
    //eventMesg.fields.get(field_index).components.add(new FieldComponent(3, false, 16, 1, 0)); // data
    eventMesg.addField(new Field("data", 3, 134, 1, 0, "", false));
    //eventMesg.fields.get(field_index).subFields.add(new SubField("timer_trigger", 0, 1, 0, ""));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 0);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("course_point_index", 132, 1, 0, ""));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 10);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("battery_level", 132, 1000, 0, "V"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 11);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("virtual_partner_speed", 132, 1000, 0, "m/s"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 12);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("hr_high_alert", 2, 1, 0, "bpm"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 13);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("hr_low_alert", 2, 1, 0, "bpm"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 14);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("speed_high_alert", 134, 1000, 0, "m/s"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 15);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("speed_low_alert", 134, 1000, 0, "m/s"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 16);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("cad_high_alert", 132, 1, 0, "rpm"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 17);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("cad_low_alert", 132, 1, 0, "rpm"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 18);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("power_high_alert", 132, 1, 0, "watts"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 19);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("power_low_alert", 132, 1, 0, "watts"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 20);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("time_duration_alert", 134, 1000, 0, "s"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 23);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("distance_duration_alert", 134, 100, 0, "m"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 24);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("calorie_duration_alert", 134, 1, 0, "calories"));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 25);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("fitness_equipment_state", 0, 1, 0, ""));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 27);
    //eventMesg.fields.get(field_index).subFields.add(new SubField("sport_point", 134, 1, 0, ""));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 33);
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addComponent(new FieldComponent(7, false, 16, 1, 0));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addComponent(new FieldComponent(8, false, 16, 1, 0));
    //eventMesg.fields.get(field_index).subFields.add(new SubField("gear_change_data", 134, 1, 0, ""));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 42);
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 43);
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addComponent(new FieldComponent(11, false, 8, 1, 0));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addComponent(new FieldComponent(12, false, 8, 1, 0));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addComponent(new FieldComponent(9, false, 8, 1, 0));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addComponent(new FieldComponent(10, false, 8, 1, 0));
    //eventMesg.fields.get(field_index).subFields.add(new SubField("rider_position", 0, 1, 0, ""));
    //eventMesg.fields.get(field_index).subFields.get(subfield_index).addMap(0, 44);

    eventMesg.addField(new Field("event_group", 4, 2, 1, 0, "", false));
    eventMesg.addField(new Field("score", 7, 132, 1, 0, "", false));
    eventMesg.addField(new Field("opponent_score", 8, 132, 1, 0, "", false));
    eventMesg.addField(new Field("front_gear_num", 9, 10, 1, 0, "", false));
    eventMesg.addField(new Field("front_gear", 10, 10, 1, 0, "", false));
    eventMesg.addField(new Field("rear_gear_num", 11, 10, 1, 0, "", false));
    eventMesg.addField(new Field("rear_gear", 12, 10, 1, 0, "", false));

    var deviceInfoMesg = new Mesg("device_info", 23);
    deviceInfoMesg.addField(new Field("timestamp", 253, 134, 1, 0, "s", false));
    deviceInfoMesg.addField(new Field("device_index", 0, 2, 1, 0, "", false));
    deviceInfoMesg.addField(new Field("device_type", 1, 2, 1, 0, "", false));
    //deviceInfoMesg.fields.get(field_index).subFields.add(new SubField("antplus_device_type", 2, 1, 0, ""));
    //deviceInfoMesg.fields.get(field_index).subFields.get(subfield_index).addMap(25, 1);
    //deviceInfoMesg.fields.get(field_index).subFields.add(new SubField("ant_device_type", 2, 1, 0, ""));
    //deviceInfoMesg.fields.get(field_index).subFields.get(subfield_index).addMap(25, 0);
    deviceInfoMesg.addField(new Field("manufacturer", 2, 132, 1, 0, "", false));
    deviceInfoMesg.addField(new Field("serial_number", 3, 140, 1, 0, "", false));
    deviceInfoMesg.addField(new Field("product", 4, 132, 1, 0, "", false));
    deviceInfoMesg.addField(new Field("software_version", 5, 132, 100, 0, "", false));
    deviceInfoMesg.addField(new Field("hardware_version", 6, 2, 1, 0, "", false));
    deviceInfoMesg.addField(new Field("cum_operating_time", 7, 134, 1, 0, "s", false));
    deviceInfoMesg.addField(new Field("battery_voltage", 10, 132, 256, 0, "V", false));
    deviceInfoMesg.addField(new Field("battery_status", 11, 2, 1, 0, "", false));
    deviceInfoMesg.addField(new Field("sensor_position", 18, 0, 1, 0, "", false));
    deviceInfoMesg.addField(new Field("descriptor", 19, 7, 1, 0, "", false));
    deviceInfoMesg.addField(new Field("ant_transmission_type", 20, 10, 1, 0, "", false));
    deviceInfoMesg.addField(new Field("ant_device_number", 21, 139, 1, 0, "", false));
    deviceInfoMesg.addField(new Field("ant_network", 22, 0, 1, 0, "", false));
    deviceInfoMesg.addField(new Field("source_type", 25, 0, 1, 0, "", false));

    var recordMesg = new Mesg("record", MesgNum.RECORD);
    recordMesg.addField(new Field("timestamp", 253, 134, 1, 0, "s", false));
    recordMesg.addField(new Field("position_lat", 0, 133, 1, 0, "deg", false));
    recordMesg.addField(new Field("position_long", 1, 133, 1, 0, "deg", false));
    recordMesg.addField(new Field("altitude", 2, 132, 5, 500, "m", false));
    //recordMesg.fields.get(field_index).components.add(new FieldComponent(78, false, 16, 5, 500)); // enhanced_altitude
    recordMesg.addField(new Field("heart_rate", 3, 2, 1, 0, "bpm", false));
    recordMesg.addField(new Field("cadence", 4, 2, 1, 0, "rpm", false));
    recordMesg.addField(new Field("distance", 5, 134, 100, 0, "m", true));
    recordMesg.addField(new Field("speed", 6, 132, 1000, 0, "m/s", false));
    //recordMesg.fields.get(field_index).components.add(new FieldComponent(73, false, 16, 1000, 0)); // enhanced_speed
    recordMesg.addField(new Field("power", 7, 132, 1, 0, "watts", false));
    recordMesg.addField(new Field("compressed_speed_distance", 8, 13, 1, 0, "", false));
    //recordMesg.fields.get(field_index).components.add(new FieldComponent(6, false, 12, 100, 0)); // speed
    //recordMesg.fields.get(field_index).components.add(new FieldComponent(5, true, 12, 16, 0)); // distance
    recordMesg.addField(new Field("grade", 9, 131, 100, 0, "%", false));
    recordMesg.addField(new Field("resistance", 10, 2, 1, 0, "", false));
    recordMesg.addField(new Field("time_from_course", 11, 133, 1000, 0, "s", false));
    recordMesg.addField(new Field("cycle_length", 12, 2, 100, 0, "m", false));
    recordMesg.addField(new Field("temperature", 13, 1, 1, 0, "C", false));

    var lapMesg = new Mesg("lap", MesgNum.LAP);
    lapMesg.addField(new Field("message_index", 254, 132, 1, 0, "", false));
    lapMesg.addField(new Field("timestamp", 253, 134, 1, 0, "s", false));
    lapMesg.addField(new Field("event", 0, 0, 1, 0, "", false));
    lapMesg.addField(new Field("event_type", 1, 0, 1, 0, "", false));
    lapMesg.addField(new Field("start_time", 2, 134, 1, 0, "", false));
    lapMesg.addField(new Field("start_position_lat", 3, 133, 1, 0, "deg", false));
    lapMesg.addField(new Field("start_position_long", 4, 133, 1, 0, "deg", false));
    lapMesg.addField(new Field("end_position_lat", 5, 133, 1, 0, "deg", false));
    lapMesg.addField(new Field("end_position_long", 6, 133, 1, 0, "deg", false));
    lapMesg.addField(new Field("total_elapsed_time", 7, 134, 1000, 0, "s", false));
    lapMesg.addField(new Field("total_timer_time", 8, 134, 1000, 0, "s", false));
    lapMesg.addField(new Field("total_distance", 9, 134, 100, 0, "m", false));
    lapMesg.addField(new Field("total_cycles", 10, 134, 1, 0, "cycles", false));
    //lapMesg.fields.get(field_index).subFields.add(new SubField("total_strides", 134, 1, 0, "strides"));
    //lapMesg.fields.get(field_index).subFields.get(subfield_index).addMap(25, 1);
    //lapMesg.fields.get(field_index).subFields.get(subfield_index).addMap(25, 11);
    lapMesg.addField(new Field("total_calories", 11, 132, 1, 0, "kcal", false));
    lapMesg.addField(new Field("total_fat_calories", 12, 132, 1, 0, "kcal", false));
    lapMesg.addField(new Field("avg_speed", 13, 132, 1000, 0, "m/s", false));
    //lapMesg.fields.get(field_index).components.add(new FieldComponent(110, false, 16, 1000, 0)); // enhanced_avg_speed
    lapMesg.addField(new Field("max_speed", 14, 132, 1000, 0, "m/s", false));
    //lapMesg.fields.get(field_index).components.add(new FieldComponent(111, false, 16, 1000, 0)); // enhanced_max_speed
    lapMesg.addField(new Field("avg_heart_rate", 15, 2, 1, 0, "bpm", false));
    lapMesg.addField(new Field("max_heart_rate", 16, 2, 1, 0, "bpm", false));
    lapMesg.addField(new Field("avg_cadence", 17, 2, 1, 0, "rpm", false));
    //lapMesg.fields.get(field_index).subFields.add(new SubField("avg_running_cadence", 2, 1, 0, "strides/min"));
    //lapMesg.fields.get(field_index).subFields.get(subfield_index).addMap(25, 1);
    lapMesg.addField(new Field("max_cadence", 18, 2, 1, 0, "rpm", false));
    //lapMesg.fields.get(field_index).subFields.add(new SubField("max_running_cadence", 2, 1, 0, "strides/min"));
    //lapMesg.fields.get(field_index).subFields.get(subfield_index).addMap(25, 1);
    lapMesg.addField(new Field("avg_power", 19, 132, 1, 0, "watts", false));
    lapMesg.addField(new Field("max_power", 20, 132, 1, 0, "watts", false));
    lapMesg.addField(new Field("total_ascent", 21, 132, 1, 0, "m", false));
    lapMesg.addField(new Field("total_descent", 22, 132, 1, 0, "m", false));
    lapMesg.addField(new Field("intensity", 23, 0, 1, 0, "", false));
    lapMesg.addField(new Field("lap_trigger", 24, 0, 1, 0, "", false));
    lapMesg.addField(new Field("sport", 25, 0, 1, 0, "", false));
    lapMesg.addField(new Field("event_group", 26, 2, 1, 0, "", false));
    lapMesg.addField(new Field("num_lengths", 32, 132, 1, 0, "lengths", false));
    lapMesg.addField(new Field("normalized_power", 33, 132, 1, 0, "watts", false));
    lapMesg.addField(new Field("left_right_balance", 34, 132, 1, 0, "", false));
    lapMesg.addField(new Field("first_length_index", 35, 132, 1, 0, "", false));
    lapMesg.addField(new Field("avg_stroke_distance", 37, 132, 100, 0, "m", false));
    lapMesg.addField(new Field("swim_stroke", 38, 0, 1, 0, "", false));
    lapMesg.addField(new Field("sub_sport", 39, 0, 1, 0, "", false));
    lapMesg.addField(new Field("num_active_lengths", 40, 132, 1, 0, "lengths", false));
    lapMesg.addField(new Field("total_work", 41, 134, 1, 0, "J", false));
    lapMesg.addField(new Field("avg_altitude", 42, 132, 5, 500, "m", false));
    //lapMesg.fields.get(field_index).components.add(new FieldComponent(112, false, 16, 5, 500)); // enhanced_avg_altitude
    lapMesg.addField(new Field("max_altitude", 43, 132, 5, 500, "m", false));
    //lapMesg.fields.get(field_index).components.add(new FieldComponent(114, false, 16, 5, 500)); // enhanced_max_altitude
    lapMesg.addField(new Field("gps_accuracy", 44, 2, 1, 0, "m", false));
    lapMesg.addField(new Field("avg_grade", 45, 131, 100, 0, "%", false));
    lapMesg.addField(new Field("avg_pos_grade", 46, 131, 100, 0, "%", false));
    lapMesg.addField(new Field("avg_neg_grade", 47, 131, 100, 0, "%", false));
    lapMesg.addField(new Field("max_pos_grade", 48, 131, 100, 0, "%", false));
    lapMesg.addField(new Field("max_neg_grade", 49, 131, 100, 0, "%", false));
    lapMesg.addField(new Field("avg_temperature", 50, 1, 1, 0, "C", false));
    lapMesg.addField(new Field("max_temperature", 51, 1, 1, 0, "C", false));
    lapMesg.addField(new Field("total_moving_time", 52, 134, 1000, 0, "s", false));
    lapMesg.addField(new Field("avg_pos_vertical_speed", 53, 131, 1000, 0, "m/s", false));
    lapMesg.addField(new Field("avg_neg_vertical_speed", 54, 131, 1000, 0, "m/s", false));
    lapMesg.addField(new Field("max_pos_vertical_speed", 55, 131, 1000, 0, "m/s", false));
    lapMesg.addField(new Field("max_neg_vertical_speed", 56, 131, 1000, 0, "m/s", false));
    lapMesg.addField(new Field("time_in_hr_zone", 57, 134, 1000, 0, "s", false));
    lapMesg.addField(new Field("time_in_speed_zone", 58, 134, 1000, 0, "s", false));
    lapMesg.addField(new Field("time_in_cadence_zone", 59, 134, 1000, 0, "s", false));
    lapMesg.addField(new Field("time_in_power_zone", 60, 134, 1000, 0, "s", false));
    lapMesg.addField(new Field("repetition_num", 61, 132, 1, 0, "", false));
    lapMesg.addField(new Field("min_altitude", 62, 132, 5, 500, "m", false));
    //lapMesg.fields.get(field_index).components.add(new FieldComponent(113, false, 16, 5, 500)); // enhanced_min_altitude
    lapMesg.addField(new Field("min_heart_rate", 63, 2, 1, 0, "bpm", false));
    lapMesg.addField(new Field("wkt_step_index", 71, 132, 1, 0, "", false));
    lapMesg.addField(new Field("opponent_score", 74, 132, 1, 0, "", false));
    lapMesg.addField(new Field("stroke_count", 75, 132, 1, 0, "counts", false));
    lapMesg.addField(new Field("zone_count", 76, 132, 1, 0, "counts", false));
    lapMesg.addField(new Field("avg_vertical_oscillation", 77, 132, 10, 0, "mm", false));
    lapMesg.addField(new Field("avg_stance_time_percent", 78, 132, 100, 0, "percent", false));
    lapMesg.addField(new Field("avg_stance_time", 79, 132, 10, 0, "ms", false));
    lapMesg.addField(new Field("avg_fractional_cadence", 80, 2, 128, 0, "rpm", false));
    lapMesg.addField(new Field("max_fractional_cadence", 81, 2, 128, 0, "rpm", false));
    lapMesg.addField(new Field("total_fractional_cycles", 82, 2, 128, 0, "cycles", false));
    lapMesg.addField(new Field("player_score", 83, 132, 1, 0, "", false));
    lapMesg.addField(new Field("avg_total_hemoglobin_conc", 84, 132, 100, 0, "g/dL", false));
    lapMesg.addField(new Field("min_total_hemoglobin_conc", 85, 132, 100, 0, "g/dL", false));
    lapMesg.addField(new Field("max_total_hemoglobin_conc", 86, 132, 100, 0, "g/dL", false));
    lapMesg.addField(new Field("avg_saturated_hemoglobin_percent", 87, 132, 10, 0, "%", false));
    lapMesg.addField(new Field("min_saturated_hemoglobin_percent", 88, 132, 10, 0, "%", false));
    lapMesg.addField(new Field("max_saturated_hemoglobin_percent", 89, 132, 10, 0, "%", false));
    lapMesg.addField(new Field("avg_left_torque_effectiveness", 91, 2, 2, 0, "percent", false));
    lapMesg.addField(new Field("avg_right_torque_effectiveness", 92, 2, 2, 0, "percent", false));
    lapMesg.addField(new Field("avg_left_pedal_smoothness", 93, 2, 2, 0, "percent", false));
    lapMesg.addField(new Field("avg_right_pedal_smoothness", 94, 2, 2, 0, "percent", false));
    lapMesg.addField(new Field("avg_combined_pedal_smoothness", 95, 2, 2, 0, "percent", false));
    lapMesg.addField(new Field("time_standing", 98, 134, 1000, 0, "s", false));
    lapMesg.addField(new Field("stand_count", 99, 132, 1, 0, "", false));
    lapMesg.addField(new Field("avg_left_pco", 100, 1, 1, 0, "mm", false));
    lapMesg.addField(new Field("avg_right_pco", 101, 1, 1, 0, "mm", false));
    lapMesg.addField(new Field("avg_left_power_phase", 102, 2, 0.7111111, 0, "degrees", false));
    lapMesg.addField(new Field("avg_left_power_phase_peak", 103, 2, 0.7111111, 0, "degrees", false));
    lapMesg.addField(new Field("avg_right_power_phase", 104, 2, 0.7111111, 0, "degrees", false));
    lapMesg.addField(new Field("avg_right_power_phase_peak", 105, 2, 0.7111111, 0, "degrees", false));
    lapMesg.addField(new Field("avg_power_position", 106, 132, 1, 0, "watts", false));
    lapMesg.addField(new Field("max_power_position", 107, 132, 1, 0, "watts", false));
    lapMesg.addField(new Field("avg_cadence_position", 108, 2, 1, 0, "rpm", false));
    lapMesg.addField(new Field("max_cadence_position", 109, 2, 1, 0, "rpm", false));
    lapMesg.addField(new Field("enhanced_avg_speed", 110, 134, 1000, 0, "m/s", false));
    lapMesg.addField(new Field("enhanced_max_speed", 111, 134, 1000, 0, "m/s", false));
    lapMesg.addField(new Field("enhanced_avg_altitude", 112, 134, 5, 500, "m", false));
    lapMesg.addField(new Field("enhanced_min_altitude", 113, 134, 5, 500, "m", false));
    lapMesg.addField(new Field("enhanced_max_altitude", 114, 134, 5, 500, "m", false));
    lapMesg.addField(new Field("avg_lev_motor_power", 115, 132, 1, 0, "watts", false));
    lapMesg.addField(new Field("max_lev_motor_power", 116, 132, 1, 0, "watts", false));
    lapMesg.addField(new Field("lev_battery_consumption", 117, 2, 2, 0, "percent", false));

    var sessionMesg = new Mesg("session", MesgNum.SESSION);
    sessionMesg.addField(new Field("message_index", 254, 132, 1, 0, "", false));
    sessionMesg.addField(new Field("timestamp", 253, 134, 1, 0, "s", false));
    sessionMesg.addField(new Field("event", 0, 0, 1, 0, "", false));
    sessionMesg.addField(new Field("event_type", 1, 0, 1, 0, "", false));
    sessionMesg.addField(new Field("start_time", 2, 134, 1, 0, "", false));
    sessionMesg.addField(new Field("start_position_lat", 3, 133, 1, 0, "deg", false));
    sessionMesg.addField(new Field("start_position_long", 4, 133, 1, 0, "deg", false));
    sessionMesg.addField(new Field("sport", 5, 0, 1, 0, "", false));
    sessionMesg.addField(new Field("sub_sport", 6, 0, 1, 0, "", false));
    sessionMesg.addField(new Field("total_elapsed_time", 7, 134, 1000, 0, "s", false));
    sessionMesg.addField(new Field("total_timer_time", 8, 134, 1000, 0, "s", false));
    sessionMesg.addField(new Field("total_distance", 9, 134, 100, 0, "m", false));
    sessionMesg.addField(new Field("total_cycles", 10, 134, 1, 0, "cycles", false));
    //sessionMesg.fields.get(field_index).subFields.add(new SubField("total_strides", 134, 1, 0, "strides"));
    //sessionMesg.fields.get(field_index).subFields.get(subfield_index).addMap(5, 1);
    //sessionMesg.fields.get(field_index).subFields.get(subfield_index).addMap(5, 11);
    sessionMesg.addField(new Field("total_calories", 11, 132, 1, 0, "kcal", false));
    sessionMesg.addField(new Field("total_fat_calories", 13, 132, 1, 0, "kcal", false));
    sessionMesg.addField(new Field("avg_speed", 14, 132, 1000, 0, "m/s", false));
    //sessionMesg.fields.get(field_index).components.add(new FieldComponent(124, false, 16, 1000, 0)); // enhanced_avg_speed
    sessionMesg.addField(new Field("max_speed", 15, 132, 1000, 0, "m/s", false));
    //sessionMesg.fields.get(field_index).components.add(new FieldComponent(125, false, 16, 1000, 0)); // enhanced_max_speed
    sessionMesg.addField(new Field("avg_heart_rate", 16, 2, 1, 0, "bpm", false));
    sessionMesg.addField(new Field("max_heart_rate", 17, 2, 1, 0, "bpm", false));
    sessionMesg.addField(new Field("avg_cadence", 18, 2, 1, 0, "rpm", false));
    //sessionMesg.fields.get(field_index).subFields.add(new SubField("avg_running_cadence", 2, 1, 0, "strides/min"));
    //sessionMesg.fields.get(field_index).subFields.get(subfield_index).addMap(5, 1);
    sessionMesg.addField(new Field("max_cadence", 19, 2, 1, 0, "rpm", false));
    //sessionMesg.fields.get(field_index).subFields.add(new SubField("max_running_cadence", 2, 1, 0, "strides/min"));
    //sessionMesg.fields.get(field_index).subFields.get(subfield_index).addMap(5, 1);
    sessionMesg.addField(new Field("avg_power", 20, 132, 1, 0, "watts", false));
    sessionMesg.addField(new Field("max_power", 21, 132, 1, 0, "watts", false));
    sessionMesg.addField(new Field("total_ascent", 22, 132, 1, 0, "m", false));
    sessionMesg.addField(new Field("total_descent", 23, 132, 1, 0, "m", false));
    sessionMesg.addField(new Field("total_training_effect", 24, 2, 10, 0, "", false));
    sessionMesg.addField(new Field("first_lap_index", 25, 132, 1, 0, "", false));
    sessionMesg.addField(new Field("num_laps", 26, 132, 1, 0, "", false));
    sessionMesg.addField(new Field("event_group", 27, 2, 1, 0, "", false));
    sessionMesg.addField(new Field("trigger", 28, 0, 1, 0, "", false));
    sessionMesg.addField(new Field("nec_lat", 29, 133, 1, 0, "deg", false));
    sessionMesg.addField(new Field("nec_long", 30, 133, 1, 0, "deg", false));
    sessionMesg.addField(new Field("swc_lat", 31, 133, 1, 0, "deg", false));
    sessionMesg.addField(new Field("swc_long", 32, 133, 1, 0, "deg", false));
    sessionMesg.addField(new Field("normalized_power", 34, 132, 1, 0, "watts", false));
    sessionMesg.addField(new Field("training_stress_score", 35, 132, 10, 0, "tss", false));
    sessionMesg.addField(new Field("intensity_factor", 36, 132, 1000, 0, "if", false));
    sessionMesg.addField(new Field("left_right_balance", 37, 132, 1, 0, "", false));
    sessionMesg.addField(new Field("avg_stroke_count", 41, 134, 10, 0, "strokes/lap", false));
    sessionMesg.addField(new Field("avg_stroke_distance", 42, 132, 100, 0, "m", false));
    sessionMesg.addField(new Field("swim_stroke", 43, 0, 1, 0, "swim_stroke", false));
    sessionMesg.addField(new Field("pool_length", 44, 132, 100, 0, "m", false));
    sessionMesg.addField(new Field("threshold_power", 45, 132, 1, 0, "watts", false));
    sessionMesg.addField(new Field("pool_length_unit", 46, 0, 1, 0, "", false));
    sessionMesg.addField(new Field("num_active_lengths", 47, 132, 1, 0, "lengths", false));
    sessionMesg.addField(new Field("total_work", 48, 134, 1, 0, "J", false));
    sessionMesg.addField(new Field("avg_altitude", 49, 132, 5, 500, "m", false));
    //sessionMesg.fields.get(field_index).components.add(new FieldComponent(126, false, 16, 5, 500)); // enhanced_avg_altitude
    sessionMesg.addField(new Field("max_altitude", 50, 132, 5, 500, "m", false));
    //sessionMesg.fields.get(field_index).components.add(new FieldComponent(128, false, 16, 5, 500)); // enhanced_max_altitude
    sessionMesg.addField(new Field("gps_accuracy", 51, 2, 1, 0, "m", false));
    sessionMesg.addField(new Field("avg_grade", 52, 131, 100, 0, "%", false));
    sessionMesg.addField(new Field("avg_pos_grade", 53, 131, 100, 0, "%", false));
    sessionMesg.addField(new Field("avg_neg_grade", 54, 131, 100, 0, "%", false));
    sessionMesg.addField(new Field("max_pos_grade", 55, 131, 100, 0, "%", false));
    sessionMesg.addField(new Field("max_neg_grade", 56, 131, 100, 0, "%", false));
    sessionMesg.addField(new Field("avg_temperature", 57, 1, 1, 0, "C", false));
    sessionMesg.addField(new Field("max_temperature", 58, 1, 1, 0, "C", false));
    sessionMesg.addField(new Field("total_moving_time", 59, 134, 1000, 0, "s", false));
    sessionMesg.addField(new Field("avg_pos_vertical_speed", 60, 131, 1000, 0, "m/s", false));
    sessionMesg.addField(new Field("avg_neg_vertical_speed", 61, 131, 1000, 0, "m/s", false));
    sessionMesg.addField(new Field("max_pos_vertical_speed", 62, 131, 1000, 0, "m/s", false));
    sessionMesg.addField(new Field("max_neg_vertical_speed", 63, 131, 1000, 0, "m/s", false));
    sessionMesg.addField(new Field("min_heart_rate", 64, 2, 1, 0, "bpm", false));
    sessionMesg.addField(new Field("time_in_hr_zone", 65, 134, 1000, 0, "s", false));
    sessionMesg.addField(new Field("time_in_speed_zone", 66, 134, 1000, 0, "s", false));
    sessionMesg.addField(new Field("time_in_cadence_zone", 67, 134, 1000, 0, "s", false));
    sessionMesg.addField(new Field("time_in_power_zone", 68, 134, 1000, 0, "s", false));
    sessionMesg.addField(new Field("avg_lap_time", 69, 134, 1000, 0, "s", false));
    sessionMesg.addField(new Field("best_lap_index", 70, 132, 1, 0, "", false));
    sessionMesg.addField(new Field("min_altitude", 71, 132, 5, 500, "m", false));
    //sessionMesg.fields.get(field_index).components.add(new FieldComponent(127, false, 16, 5, 500)); // enhanced_min_altitude
    sessionMesg.addField(new Field("player_score", 82, 132, 1, 0, "", false));
    sessionMesg.addField(new Field("opponent_score", 83, 132, 1, 0, "", false));
    sessionMesg.addField(new Field("opponent_name", 84, 7, 1, 0, "", false));
    sessionMesg.addField(new Field("stroke_count", 85, 132, 1, 0, "counts", false));
    sessionMesg.addField(new Field("zone_count", 86, 132, 1, 0, "counts", false));
    sessionMesg.addField(new Field("max_ball_speed", 87, 132, 100, 0, "m/s", false));
    sessionMesg.addField(new Field("avg_ball_speed", 88, 132, 100, 0, "m/s", false));
    sessionMesg.addField(new Field("avg_vertical_oscillation", 89, 132, 10, 0, "mm", false));
    sessionMesg.addField(new Field("avg_stance_time_percent", 90, 132, 100, 0, "percent", false));
    sessionMesg.addField(new Field("avg_stance_time", 91, 132, 10, 0, "ms", false));
    sessionMesg.addField(new Field("avg_fractional_cadence", 92, 2, 128, 0, "rpm", false));
    sessionMesg.addField(new Field("max_fractional_cadence", 93, 2, 128, 0, "rpm", false));
    sessionMesg.addField(new Field("total_fractional_cycles", 94, 2, 128, 0, "cycles", false));
    sessionMesg.addField(new Field("avg_total_hemoglobin_conc", 95, 132, 100, 0, "g/dL", false));
    sessionMesg.addField(new Field("min_total_hemoglobin_conc", 96, 132, 100, 0, "g/dL", false));
    sessionMesg.addField(new Field("max_total_hemoglobin_conc", 97, 132, 100, 0, "g/dL", false));
    sessionMesg.addField(new Field("avg_saturated_hemoglobin_percent", 98, 132, 10, 0, "%", false));
    sessionMesg.addField(new Field("min_saturated_hemoglobin_percent", 99, 132, 10, 0, "%", false));
    sessionMesg.addField(new Field("max_saturated_hemoglobin_percent", 100, 132, 10, 0, "%", false));
    sessionMesg.addField(new Field("avg_left_torque_effectiveness", 101, 2, 2, 0, "percent", false));
    sessionMesg.addField(new Field("avg_right_torque_effectiveness", 102, 2, 2, 0, "percent", false));
    sessionMesg.addField(new Field("avg_left_pedal_smoothness", 103, 2, 2, 0, "percent", false));
    sessionMesg.addField(new Field("avg_right_pedal_smoothness", 104, 2, 2, 0, "percent", false));
    sessionMesg.addField(new Field("avg_combined_pedal_smoothness", 105, 2, 2, 0, "percent", false));
    sessionMesg.addField(new Field("sport_index", 111, 2, 1, 0, "", false));
    sessionMesg.addField(new Field("time_standing", 112, 134, 1000, 0, "s", false));
    sessionMesg.addField(new Field("stand_count", 113, 132, 1, 0, "", false));
    sessionMesg.addField(new Field("avg_left_pco", 114, 1, 1, 0, "mm", false));
    sessionMesg.addField(new Field("avg_right_pco", 115, 1, 1, 0, "mm", false));
    sessionMesg.addField(new Field("avg_left_power_phase", 116, 2, 0.7111111, 0, "degrees", false));
    sessionMesg.addField(new Field("avg_left_power_phase_peak", 117, 2, 0.7111111, 0, "degrees", false));
    sessionMesg.addField(new Field("avg_right_power_phase", 118, 2, 0.7111111, 0, "degrees", false));
    sessionMesg.addField(new Field("avg_right_power_phase_peak", 119, 2, 0.7111111, 0, "degrees", false));
    sessionMesg.addField(new Field("avg_power_position", 120, 132, 1, 0, "watts", false));
    sessionMesg.addField(new Field("max_power_position", 121, 132, 1, 0, "watts", false));
    sessionMesg.addField(new Field("avg_cadence_position", 122, 2, 1, 0, "rpm", false));
    sessionMesg.addField(new Field("max_cadence_position", 123, 2, 1, 0, "rpm", false));
    sessionMesg.addField(new Field("enhanced_avg_speed", 124, 134, 1000, 0, "m/s", false));
    sessionMesg.addField(new Field("enhanced_max_speed", 125, 134, 1000, 0, "m/s", false));
    sessionMesg.addField(new Field("enhanced_avg_altitude", 126, 134, 5, 500, "m", false));
    sessionMesg.addField(new Field("enhanced_min_altitude", 127, 134, 5, 500, "m", false));
    sessionMesg.addField(new Field("enhanced_max_altitude", 128, 134, 5, 500, "m", false));
    sessionMesg.addField(new Field("avg_lev_motor_power", 129, 132, 1, 0, "watts", false));
    sessionMesg.addField(new Field("max_lev_motor_power", 130, 132, 1, 0, "watts", false));
    sessionMesg.addField(new Field("lev_battery_consumption", 131, 2, 2, 0, "percent", false));

    var activityMesg = new Mesg("activity", MesgNum.ACTIVITY);
    activityMesg.addField(new Field("timestamp", 253, 134, 1, 0, "", false));
    activityMesg.addField(new Field("total_timer_time", 0, 134, 1000, 0, "s", false));
    activityMesg.addField(new Field("num_sessions", 1, 132, 1, 0, "", false));
    activityMesg.addField(new Field("type", 2, 0, 1, 0, "", false));
    activityMesg.addField(new Field("event", 3, 0, 1, 0, "", false));
    activityMesg.addField(new Field("event_type", 4, 0, 1, 0, "", false));
    activityMesg.addField(new Field("local_timestamp", 5, 134, 1, 0, "", false));
    activityMesg.addField(new Field("event_group", 6, 2, 1, 0, "", false));

    return FitTypes;
});
