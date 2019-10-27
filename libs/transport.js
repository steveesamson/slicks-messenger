var nodemailer = require('nodemailer'),
    fs = require('fs'),
    _ = require('underscore'),
    request = require('request'),
    stud = require('stud'),
    smtpPool = require('nodemailer-smtp-pool'),
    mailConfig = {
        host: 'mail-host',
        port: 25,
        auth: {
            user: 'mail-username',
            pass: 'mail-user-pswd'
        },
        maxConnections: 5,
        maxMessages: 10
    },
    smsConfig = {
        url: 'sms-api-url',
        method: 'GET',
        qs: {
            cmd: 'sendquickmsg',
            owneremail: 'owner-email',
            subacct: 'sub_acct',
            subacctpwd: 'sub_acc_pswd',
            message: '',
            sender: 'Sender',
            sendto: '',
            msgtype: 0
        }
    },
    mail = function (mailLoad, cb) {
        var transporter = nodemailer.createTransport(smtpPool(mailConfig)),
	    mailOptions = {
            from: mailLoad.from,// // sender address
            to: mailLoad.to,
            subject: mailLoad.subject, // Subject line
            text: mailLoad.message, // plaintext body
            html: mailLoad.html
        };

// send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {

            if (error) {
                console.error(error);
                cb && cb(error);

            } else {
                cb && cb(false, 'Message sent: ' + info.response);
            }
            transporter.close();

        });
    },
    sms = function (smsOptions, cb) {
        var cfg = _.clone(smsConfig);
        cfg.qs.message = smsOptions.message;
        cfg.qs.sendto = smsOptions.to_phone;


        request(cfg, cb);
    };


module.exports = function (base_dir) {
    var tpl = fs.readFileSync(base_dir + "/libs/mail.html", "utf8");
    return {
        sendMail: function (options, cb) {
            options.from = 'from-email-address';

            stud.template(tpl, options, function (error, str) {

                options.html = str;
                mail(options, cb);
            });
        },
        sendSms: function (options, cb) {
            sms(options, cb);
        }
    };
};
