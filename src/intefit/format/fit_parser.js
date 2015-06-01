'use strict';
define(['q', 'crc'], function (Q, crc) {

    var readHeader = function (buffer, state) {
        var header = {
            headerSize: buffer.readUInt8(state.pos + 0),
            protocolVersion: buffer.readUInt8(state.pos + 1),
            profileVersion: buffer.readUInt16LE(state.pos + 2),
            dataSize: buffer.readUInt32LE(state.pos + 4),
            crc: buffer.readUInt16LE(state.pos + 12)
        };

        header.dataType = new Buffer(4);
        buffer.copy(header.dataType, 0, state.pos+8, state.pos + 8 + 4);
        header.dataType = header.dataType.toString('ascii');

        if (header.dataType != '.FIT') {
            throw new Error('Incorrect data format: '+header.dataType);
        }

        if (header.crc != 0) {
            var toCheck = new Buffer(12);
            buffer.copy(toCheck, 0, state.pos, state.pos + 12);
            if (crc.crc16(toCheck) != header.crc) {
                throw new Error('Incorrect CRC at: '+state.pos);
            }
        }

        state.pos += header.headerSize;

        return header;
    };

    var readRecord = function (buffer, state) {
        /*
         var test = new Buffer(100);
         buffer.copy(test, 0, state.pos, state.pos + test.length);
         console.log('POS: '+state.pos);
         console.log(test);
         */

        var firstByte = buffer.readUInt8(state.pos + 0);
        state.pos++; // skip 1st byte

        var record = {
            normal: (firstByte & 0x80) == 0
        };

        if (!record.normal) {
            record.messageType = 'data';
            record.localType = (firstByte >> 5) & 0x03;

            var timeOffset = firstByte & 0x1F;

            if (timeOffset >= (state.previousTimestamp & 0x0000001F)) {
                record.timestamp = (state.previousTimestamp)&0xFFFFFFE0 + timeOffset;
            } else {
                record.timestamp = (state.previousTimestamp)&0xFFFFFFE0 + timeOffset + 0x20;
            }

            state.previousTimestamp = record.timestamp;
        } else {
            record.messageType = (firstByte & 0x40) > 0 ? 'definition' : 'data';
            record.localType = firstByte & 0x0F;
        }

        if (record.messageType == 'definition') {
            state.pos++; // skip reserved byte

            record.architecture = buffer.readUInt8(state.pos) == 0 ? 'LE' : 'BE';
            record.globalMessageNumber = buffer.readUInt16LE(state.pos + 1);
            record.numOfFields = buffer.readUInt8(state.pos + 3);
            record.fieldDefinitions = [];

            state.pos += 4;

            for (var i = 0; i < record.numOfFields; i++) {
                var fieldDefinition = {
                    fieldDefinitionNumber: buffer.readUInt8(state.pos + 0),
                    size: buffer.readUInt8(state.pos + 1),
                    baseType: buffer.readUInt8(state.pos + 2) // Table 4-5. Base Type Bit Field
                };

                record.fieldDefinitions.push(fieldDefinition);

                state.pos += 3;
            }

            state.localDefinitions[record.localType] = record;
        } else {
            //console.log('record.localType '+record.localType);
            //console.log(state.localDefinitions);
            if (!state.localDefinitions[record.localType]) {
                console.log(state.localDefinitions);
                throw new Error('Local definition not found for local type: '+record.localType);
            }

            var definition = state.localDefinitions[record.localType];

            record.globalMessageNumber = definition.globalMessageNumber;
            record.numOfFields = definition.numOfFields;
            record.fields = [];


            for (var i = 0; i < record.numOfFields; i++) {
                var fieldDefinition = definition.fieldDefinitions[i];
                //console.log(fieldDefinition);
                //console.log(fieldDefinition.baseType.toString(16));
                var field = {};
                field.fieldDefinitionNumber = fieldDefinition.fieldDefinitionNumber;

                switch (fieldDefinition.baseType) {
                    case 0x00: // enum
                        field.value = (buffer.readUInt8(state.pos));
                        state.pos += 1;
                        break;
                    case 0x01: // sint8
                        field.value = (buffer.readInt8(state.pos));
                        state.pos += 1;
                        break;
                    case 0x02: // uint8
                        field.value = (buffer.readUInt8(state.pos));
                        state.pos += 1;
                        break;
                    case 0x83: // sint16
                        field.value = (buffer.readInt16LE(state.pos));
                        state.pos += 2;
                        break;
                    case 0x84: // uint8
                        field.value = (buffer.readUInt16LE(state.pos));
                        state.pos += 2;
                        break;
                    case 0x85: // sint32
                        field.value = (buffer.readInt32LE(state.pos));
                        state.pos += 4;
                        break;
                    case 0x86: // sint32
                        field.value = (buffer.readUInt32LE(state.pos));
                        state.pos += 4;
                        break;
                    case 0x07: // string
                        var j = 0;
                        while (buffer.readInt8(j) != 0) {
                            j++;
                        }
                        field.value = new Buffer(j);
                        buffer.copy(field.value, 0, state.pos, state.pos + state.pos + j);
                        field.value = field.value.toString();

                        state.pos += j+1;
                        break;
                    case 0x88: // float32
                        field.value = (buffer.readFloatLE(state.pos));
                        state.pos += 4;
                        break;
                    case 0x89: // float64
                        field.value = (buffer.readDoubleLE(state.pos));
                        state.pos += 8;
                        break;
                    case 0x0A: // uint8z
                        field.value = (buffer.readUInt8(state.pos));
                        state.pos += 1;
                        break;
                    case 0x8B: // uint16z
                        field.value = (buffer.readUInt16LE(state.pos));
                        state.pos += 2;
                        break;
                    case 0x8C: // uint32z
                        field.value = (buffer.readUInt32LE(state.pos));
                        state.pos += 4;
                        break;
                    case 0x0D: // byte
                        field.value = (buffer.readInt8(state.pos));
                        state.pos += 1;
                        break;
                }

                record.fields.push(field);
            }
        }

        return record;
    };

    var Parser = function () {
    };

    Parser.prototype.read = function (buffer) {
        var deferred = Q.defer();

        try {
            var state = {
                pos: 0,
                previousTimestamp: 0,
                localDefinitions: {
                }
            };

            var fit = {
                header: readHeader(buffer, state),
                data: []
            };

            var toCheck = new Buffer(fit.header.dataSize + fit.header.headerSize);
            buffer.copy(toCheck, 0, 0, fit.header.dataSize + fit.header.headerSize);
            if (crc.crc16(toCheck) != buffer.readUInt16LE(fit.header.dataSize + fit.header.headerSize)) {
                throw new Error('Incorrect file CRC');
            }

            while (state.pos < fit.header.dataSize) {
                var record = readRecord(buffer, state);
                if (record.messageType == 'data') {
                    fit.data.push(record);
                }
            }

            deferred.resolve(fit);
        } catch (err) {
            deferred.reject(err);
        }

        return deferred.promise;
    };

    return Parser;

});
