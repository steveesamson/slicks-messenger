var nodemailer = require('nodemailer'),
    fs = require('fs'),
    _ = require('underscore'),
    request = require('request'),
    stud = require('stud'),
    smtpPool = require('nodemailer-smtp-pool'),
    mailConfig = {
        host: 'mail.konvaj.com',
        port: 25,
        auth: {
            user: 'konvaj',
            pass: 'k0nv@j'
        },
        maxConnections: 5,
        maxMessages: 10
    },
    smsConfig = {
        url: 'http://www.smslive247.com/http/index.aspx',
        method: 'GET',
        qs: {
            cmd: 'sendquickmsg',
            owneremail: 'eccle2002@yahoo.com',
            subacct: '_SHEPHERD_',
            subacctpwd: '5h3ph3rd',
            message: '',
            sender: 'Konvaj',
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
            options.from = 'konvaj<konvaj@konvaj.com>';

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
