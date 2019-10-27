var messanger = require('./libs/transport')(__dirname),
    stud = require('stud'),
    config = require('./libs/messages'),
    slicks_mysql = require('slicks-mysql')({
        host: 'localhost',
        user: 'db-user',
        //-dateStrings: true,
        driver: 'mysql',
        database: 'db-name',
        password: 'db-pass'
        ,
         debug_db: true
    }),
    db = null,
    templateIt = function (source, data, cb) {
        stud.template(source, data, cb);
    },
    processMessages = function () {
        var fetchMessages = function (cb) {
                console.log('Fetching...');
                db.where('status', '0')
                    .limit(100)
                    .select('messages.*')
                    .from('messages')
                    //.join('users', 'users.user_id = messages.to_user_id', 'left')
                    .orderBy('messages.id', 'ASC')
                    .fetch(function (err, rows) {
                        if (err) {
                            console.log(err);
                            cb && cb(err);
                            return;
                        }
                        cb && cb(false, rows);
                    });
            },
            doMessenger = function (msg, cb) {
                var msgTmpl = config[msg.type],
                    updateMsg = function (_cb) {
                        db.set('status', 1)
                            .where('id', msg.id)
                            .update('messages', function (e, result) {
                                _cb && _cb(false);
                            });
                    },
                    doMail = function (msg, _cb) {
                        messanger.sendMail(msg, function (e, info) {
                            if (e) {
                                console.error(e);
                                //do nothing;
                                _cb && _cb(e);
                            } else {
                                updateMsg(_cb);

                            }
                        });
                    };
                if (msgTmpl) {
                    templateIt(msgTmpl, msg, function (err, rendered) {
                        if (err) {
                            cb && cb(err);
                        } else {
                            var subj = null;
                            switch (msg.type) {
                                case 'user.created':
                                    subj = 'Welcome To Konvaj.com';
                                    break;
                                case 'send.activation':
                                    subj = 'Send Your Payment Now!';
                                    break;
                                case 'confirm.activation':
                                    subj = 'Confirm Payment Receipt Now!';
                                    break;
                                case 'otp.code':
                                    subj = 'One Time PIN';
                                    break;
                                case 'account.limited':
                                    subj = 'You Missed Money!!!';
                                    break;
                            }


                            msg.subject = subj;
                            msg.message = rendered;


                            switch (msg['target']) {
                                case 'Phone':

                                    messanger.sendSms(msg, function (e, info, body) {
                                        if (e) {
                                            //do nothing
                                            cb && cb(e);
                                        } else {
                                            var bodyArr = body && body.split(':');
                                            if (bodyArr[0].trim() === 'OK') {
                                                updateMsg(cb);

                                            } else {
                                                cb && cb(body);

                                            }
                                        }

                                    });
                                    break;
                                case 'Email':
                                    msg.to = msg.to_name + '<' + msg.to_email + '>';
                                    doMail(msg, function (e) {

                                        if (e) {
                                            console.error(e);
                                            cb && cb(e);
                                        }else{
                                             updateMsg(cb);
                                        }

                                    });

                                    break;
                                case 'Both':
                                    msg.to = msg.to_name + '<' + msg.to_email + '>';
                                    doMail(msg, function (e) {

                                        if (e) {
                                            console.error(e);
                                        }
                                        updateMsg(cb);
                                        messanger.sendSms(msg, function (e, info, body) {
                                            if (e) {
                                                //do nothing
                                                cb && cb(e);
                                            } else {
                                                var bodyArr = body && body.split(':');
                                                if (bodyArr[0].trim() === 'OK') {
                                                    updateMsg(cb);

                                                } else {
                                                    cb && cb(body);

                                                }
                                            }

                                        });
                                    });
                                    break;
                            }

                        }
                    });
                }

            },
            start = function () {
                fetchMessages(function (err, msgs) {
                    if (err) {
                        console.error('Error:' + err.message);
                        start();
                    }
                    //console.log(JSON.stringify(msgs));

                    var len = msgs.length, startIndex = 0;
                    if (len) {
                        var run = function () {
                            doMessenger(msgs[startIndex++], function (e) {
                                if (e) {
                                    console.error(e);
                                }
                                if (startIndex === len) {
                                    /* console.log('Restarting...');*/
                                    start();
                                } else {
                                    run();
                                }
                            });
                        };
                        run();
                    } else {
                        start();
                    }
                });
            };
        start();

    };

slicks_mysql.connect(function (err, _db) {
    if (err) {
        console.error('Unable to connect to Database: ' + err.message);
        return;
    }
    db = _db;
    console.log('Connected to database.');
    processMessages();

});



