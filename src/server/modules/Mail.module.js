/*
* @Author: Craig Bojko
* @Date:   2017-06-01 14:36:54
* @Last Modified by:   Craig Bojko
* @Last Modified time: 2017-12-07 16:30:04
*/

import 'colors'
import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'
import Logger from './Logger.module'
import Hogan from 'hogan.js'

require('dotenv').config()

function buildEmailContent (data) {
  let emailWrapperFile = fs.readFileSync(path.join(__dirname, './email/wrapper.html'), 'utf8')
  let contentHTMLFile = fs.readFileSync(path.join(__dirname, './email/photoDigest.html'), 'utf8')

  let hoganWrapperTemplate = Hogan.compile(emailWrapperFile)
  let hoganContentTemplate = Hogan.compile(contentHTMLFile)

  let emailContent = hoganContentTemplate.render(data)
  let email = hoganWrapperTemplate.render({
    content: emailContent
  })

  return email
}

export default class EMail {
  constructor () {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      tls: { rejectUnauthorized: false }, // TODO - disable for PROD
      auth: {
        user: process.env.EMAILUSER,
        pass: process.env.EMAILPASS
      }
    })
  }

  sendReportMessage (data) {
    let email
    try {
      email = {
        subject: 'PhotoUPLOAD-Service: Migration report',
        targetEmail: 'craig@pixelventures.co.uk',
        content: buildEmailContent(data)
      }
      if (email) {
        Logger.info('Sending Contact Email...')
        return this.sendMail(email)
      }
    } catch (error) {
      Logger.error('Error compiling Contact Notification Email')
      return new Promise((resolve, reject) => { reject(new Error(error)) })
    }
  }

  sendMail (options) {
    return new Promise((resolve, reject) => {
      if (!options || (!options && !options.targetEmail && !options.subject && !options.content)) {
        reject(new Error('Malformed options object: ', options))
      }
      const mailOptions = {
        from: '"' + process.env.EMAILSENDERNAME + '" <' + process.env.EMAILSENDEREMAIL + '>',
        to: options.targetEmail, // list of receivers
        subject: options.subject, // Subject line
        // text: 'Hello world ?', // plain text body
        html: options.content // html body
      }

      this.send(mailOptions, resolve, reject)
    })
  }

  send (payload, resolve, reject) {
    this.transporter.sendMail(payload, (error, info) => {
      if (error) {
        Logger.error('EMAIL FAIL: ', error)
        reject(new Error(error))
      }
      Logger.info('EMAIL SUCCESS:'.green + ' Message %s sent: %s', info.messageId, info.response)
      resolve(info)
    })
  }
}
