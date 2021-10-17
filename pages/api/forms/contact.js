import { AUDIENCE_INFO } from '../../../utils/constants';
import { fieldsToEmail, parseFrom, toZeptoAttach } from '../../../utils/formHandling';
import { emailId } from '../../../utils/nanoIdProvider';
import ZeptoClient from '../../../utils/zeptomail';

const TEMPLATE_KEY = "2d6f.56fc02bbae752795.k1.f8cc6140-2f6c-11ec-b4a4-5254000e3179.17c8f3ab554";

export default async function contactForm(req, res) {

    const { fields } = await parseFrom(req);
    const refererURI = new URL(req.headers.referer);
    const sessionId = emailId();

    const config = {
        to: AUDIENCE_INFO,
        reply_to: [
            {
                address: fields.email,
                name: fields.name
            } 
        ],
        mail_template_key: TEMPLATE_KEY,
        merge_info: {
            ...fields,
            ref: sessionId
        },
        htmlbody: fieldsToEmail(`Contact Us Form ID: ${sessionId}`, fields),
    }

    try {
        await ZeptoClient.sendTemplateMail(config);
        res.redirect(303,`${refererURI.pathname}?success=true&requestId=${sessionId}`);
    } catch (err) {
        console.error(err);
        res.redirect(303,`${refererURI.pathname}?success=false&requestId=${sessionId}`);
    }
}

export const config = {
    api: {
        bodyParser: false,
    }
};