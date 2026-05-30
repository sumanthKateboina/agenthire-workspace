const { loadSpec } = require('../utils/specLoader');
const env = require('../config/env');

/**
 * Runs the Email Agent to construct and send status emails to applicants
 * @param {object} candidate - Candidate document.
 * @param {object} job - Job document.
 * @returns {Promise<object>} Status report of the email dispatch.
 */
const runEmailAgent = async (candidate, job) => {
  try {
    let specFile = 'email/rejection.json';
    if (candidate.status === 'shortlisted' || candidate.status === 'hold') {
      specFile = 'email/interview-invite.json';
    }

    const emailSpec = loadSpec(specFile);
    let { subject, template } = emailSpec;

    // Substitute variables
    const vars = {
      candidate_name: candidate.name,
      job_title: job.title
    };

    const replacePlaceholders = (str, data) => {
      let result = str;
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        result = result.replace(regex, value);
      }
      return result;
    };

    const finalSubject = replacePlaceholders(subject, vars);
    const finalHtml = replacePlaceholders(template, vars);

    let sent = false;
    let provider = 'fallback';
    let messageId = null;

    if (env.RESEND_API_KEY) {
      try {
        console.log(`[Email Agent] Dispatching real email to ${candidate.email} via Resend...`);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'AgentHire <onboarding@resend.dev>',
            to: candidate.email,
            subject: finalSubject,
            html: finalHtml
          })
        });

        if (res.ok) {
          const data = await res.json();
          sent = true;
          provider = 'resend';
          messageId = data.id;
          console.log(`[Email Agent] Email sent successfully via Resend. Msg ID: ${messageId}`);
        } else {
          const errText = await res.text();
          console.error(`[Email Agent] Resend API returned error status ${res.status}: ${errText}`);
        }
      } catch (err) {
        console.error('[Email Agent] Resend request failed. Falling back to console/state logging.', err.message);
      }
    }

    if (!sent) {
      console.log(`[Email Agent Mock] Storing fallback email structure.
Subject: ${finalSubject}
Recipient: ${candidate.email}
Body: [Rendered HTML stored in database]`);
      sent = true;
      provider = 'fallback';
    }

    return {
      sent,
      provider,
      messageId,
      subject: finalSubject,
      html: finalHtml
    };
  } catch (error) {
    console.error('Email Agent Error:', error.message);
    throw error;
  }
};

module.exports = {
  runEmailAgent
};
