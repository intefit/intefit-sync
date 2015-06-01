'use strict';
define(['q', 'intefit/format/fit_types'], function (Q, FitTypes) {

    var mapRecord = function (record) {
        var messageType = FitTypes.messageTypes[record.globalMessageNumber];

        if (record.globalMessageNumber == 22) return;
        if (record.globalMessageNumber == 79) return;

        if (!messageType) {
            throw new Error('Unknown FIT message number: ' + record.globalMessageNumber);
        }

        if (JSON.stringify(messageType.fields) == '{}') {
            throw new Error('Field messages empty: ' + record.globalMessageNumber);
        };

        record.type = messageType.name;
        record.map = {};

        for (var fieldNo = 0; fieldNo < record.fields.length; fieldNo++) {
            var field = record.fields[fieldNo];
            if (messageType.fields[field.fieldDefinitionNumber]) {
                var fieldDef = messageType.fields[field.fieldDefinitionNumber];
                field.name = fieldDef.name;

                fieldDef.values = [ field.value ];

                if (fieldDef.getString() !== null) {
                    record.map[field.name] = {
                        raw: field.value,
                        value: fieldDef.getString(),
                        units: fieldDef.units
                    };
                }
            } else {
                //record.map['unk_'+field.fieldDefinitionNumber] = {
                //    raw: field.value
                //};
            }
        }

        if (messageType.postParse) {
            messageType.postParse(record);
        }
    };

    var Mapper = function () {
    };

    Mapper.prototype.map = function (fit) {
        var deferred = Q.defer();

        try {
            for (var recNo = 0; recNo < fit.data.length; recNo++) {
                var record = fit.data[recNo];
                mapRecord(record);
            }
            deferred.resolve(fit);
        } catch (err) {
            deferred.reject(err);
        }

        return deferred.promise;
    };

    return Mapper;

});
