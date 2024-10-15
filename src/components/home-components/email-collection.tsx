import React, { useEffect, useRef } from 'react';

const EmbeddedBrevoForm = () => {
  const formRef = useRef(null);

  useEffect(() => {
    // Add the Brevo script
    const script = document.createElement('script');
    script.src = "https://sibforms.com/forms/end-form/build/main.js";
    script.async = true;
    document.body.appendChild(script);

    // Clean up function to remove the script when the component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Add the necessary global variables
    window.REQUIRED_CODE_ERROR_MESSAGE = 'Please choose a country code';
    window.LOCALE = 'en';
    window.EMAIL_INVALID_MESSAGE = window.SMS_INVALID_MESSAGE = "The information provided is invalid. Please review & try again.";
    window.REQUIRED_ERROR_MESSAGE = "This field cannot be left blank.";
    window.GENERIC_INVALID_MESSAGE = "The information provided is invalid. Please review & try again.";
    window.translation = { common: { selectedList: '{quantity} list selected', selectedLists: '{quantity} lists selected' } };
    window.AUTOHIDE = Boolean(0);
  }, []);

  return (
    <div ref={formRef}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @font-face {
          font-display: block;
          font-family: Roboto;
          src: url('https://assets.brevo.com/font/Roboto/Latin/normal/normal/7529907e9eaf8ebb5220c5f9850e3811.woff2') format('woff2'),
               url('https://assets.brevo.com/font/Roboto/Latin/normal/normal/25c678feafdc175a70922a116c9be3e7.woff') format('woff');
        }

        @font-face {
          font-display: fallback;
          font-family: Roboto;
          font-weight: 600;
          src: url('https://assets.brevo.com/font/Roboto/Latin/medium/normal/6e9caeeafb1f3491be3e32744bc30440.woff2') format('woff2'),
               url('https://assets.brevo.com/font/Roboto/Latin/medium/normal/71501f0d8d5aa95960f6475d5487d4c2.woff') format('woff');
        }

        @font-face {
          font-display: fallback;
          font-family: Roboto;
          font-weight: 700;
          src: url('https://assets.brevo.com/font/Roboto/Latin/bold/normal/3ef7cf158f310cf752d5ad08cd0e7e60.woff2') format('woff2'),
               url('https://assets.brevo.com/font/Roboto/Latin/bold/normal/ece3a1d82f18b60bcce0211725c476aa.woff') format('woff');
        }

        #sib-container input::placeholder,
        #sib-container textarea::placeholder {
          text-align: left;
          font-family: "Helvetica", sans-serif;
          color: #c0ccda;
        }

        #sib-container textarea {
          height: 100px;
          resize: vertical;
        }

        #sib-container a {
          text-decoration: underline;
          color: #2BB2FC;
        }
      `}} />

      <link rel="stylesheet" href="https://sibforms.com/forms/end-form/build/sib-styles.css" />

      <div className="sib-form" style={{ textAlign: 'center', backgroundColor: 'transparent' }}>
        <div id="sib-form-container" className="sib-form-container">
          <div id="error-message" className="sib-form-message-panel" style={{ fontSize: '16px', textAlign: 'left', color: '#661d1d', backgroundColor: '#ffeded', borderRadius: '3px', borderColor: '#ff4949', maxWidth: '540px' }}>
            <div className="sib-form-message-panel__text sib-form-message-panel__text--center">
              <svg viewBox="0 0 512 512" className="sib-icon sib-notification__icon">
                <path d="M256 40c118.621 0 216 96.075 216 216 0 119.291-96.61 216-216 216-119.244 0-216-96.562-216-216 0-119.203 96.602-216 216-216m0-32C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm-11.49 120h22.979c6.823 0 12.274 5.682 11.99 12.5l-7 168c-.268 6.428-5.556 11.5-11.99 11.5h-8.979c-6.433 0-11.722-5.073-11.99-11.5l-7-168c-.283-6.818 5.167-12.5 11.99-12.5zM256 340c-15.464 0-28 12.536-28 28s12.536 28 28 28 28-12.536 28-28-12.536-28-28-28z" />
              </svg>
              <span className="sib-form-message-panel__inner-text">
                Your subscription could not be saved. Please try again.
              </span>
            </div>
          </div>
          <div id="success-message" className="sib-form-message-panel" style={{ fontSize: '16px', textAlign: 'left', color: '#085229', backgroundColor: '#e7faf0', borderRadius: '3px', borderColor: '#13ce66', maxWidth: '540px' }}>
            <div className="sib-form-message-panel__text sib-form-message-panel__text--center">
              <svg viewBox="0 0 512 512" className="sib-icon sib-notification__icon">
                <path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 464c-118.664 0-216-96.055-216-216 0-118.663 96.055-216 216-216 118.664 0 216 96.055 216 216 0 118.663-96.055 216-216 216zm141.63-274.961L217.15 376.071c-4.705 4.667-12.303 4.637-16.97-.068l-85.878-86.572c-4.667-4.705-4.637-12.303.068-16.97l8.52-8.451c4.705-4.667 12.303-4.637 16.97.068l68.976 69.533 163.441-162.13c4.705-4.667 12.303-4.637 16.97.068l8.451 8.52c4.668 4.705 4.637 12.303-.068 16.97z" />
              </svg>
              <span className="sib-form-message-panel__inner-text">
                Thank you. Launch details coming soon!
              </span>
            </div>
          </div>
          <div id="sib-container" className="sib-container--large sib-container--vertical" style={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,1)', maxWidth: '540px', borderRadius: '3px', borderWidth: '1px', borderColor: '#C0CCD9', borderStyle: 'solid' }}>
            <form id="sib-form" method="POST" action="https://2ad770f1.sibforms.com/serve/MUIFAJutuVy3q-IaU_mtt0wjkz_tqMvN7RdEimEeQanCW5H1w7NW-COt3_Bxi_u_rva8KenQamiIS8kGTiXkMYC0qgRabYNaIN2Z3RF7cqtQ1r6lkzSLdZvYPsXrfmBOkecy2eUHShEgRD4VWxU0V9DAGAu-siDUO0qU00PZ7qMq6DiFf_RCN90sSI0Jw_D6IjpIweKu6plsvw12" data-type="subscription">
              <div style={{ padding: '8px 0' }}>
                <div className="sib-form-block" style={{ fontSize: '32px', textAlign: 'left', fontWeight: '700', fontFamily: '"Helvetica", sans-serif', color: '#3C4858', backgroundColor: 'transparent' }}>
                  <p>Get Ready for Launch!</p>
                </div>
              </div>
              <div style={{ padding: '8px 0' }}>
                <div className="sib-form-block" style={{ fontSize: '16px', textAlign: 'left', fontFamily: '"Helvetica", sans-serif', color: '#3C4858', backgroundColor: 'transparent' }}>
                  <div className="sib-text-form-block">
                    <p>Sign up to stay up to date on launch details.</p>
                  </div>
                </div>
              </div>
              <div style={{ padding: '8px 0' }}>
                <div className="sib-input sib-form-block">
                  <div className="form__entry entry_block">
                    <div className="form__label-row ">
                      <label className="entry__label" style={{ fontWeight: '700', fontSize: '16px', textAlign: 'left', fontFamily: '"Helvetica", sans-serif', color: '#3c4858' }} htmlFor="EMAIL" data-required="*">
                        Subscribe for email updates
                      </label>

                      <div className="entry__field">
                        <input className="input" type="text" id="EMAIL" name="EMAIL" autoComplete="off" placeholder="EMAIL" data-required="true" required />
                      </div>
                    </div>

                    <label className="entry__error entry__error--primary" style={{ fontSize: '16px', textAlign: 'left', fontFamily: '"Helvetica", sans-serif', color: '#661d1d', backgroundColor: '#ffeded', borderRadius: '3px', borderColor: '#ff4949' }}>
                    </label>
                    <label className="entry__specification" style={{ fontSize: '12px', textAlign: 'left', fontFamily: '"Helvetica", sans-serif', color: '#8390A4' }}>
                      Provide your email address to subscribe. For e.g abc@xyz.com
                    </label>
                  </div>
                </div>
              </div>
              <div style={{ padding: '8px 0' }}>
                <div className="sib-input sib-form-block">
                  <div className="form__entry entry_block">
                    <div className="form__label-row ">
                      <label className="entry__label" style={{ fontWeight: '700', fontSize: '16px', textAlign: 'left', fontFamily: '"Helvetica", sans-serif', color: '#3c4858' }} htmlFor="SMS" data-required="*">
                        Subscribe for text updates
                      </label>

                      <div className="entry__field">
                        <input className="input" type="text" id="SMS" name="SMS" autoComplete="off" placeholder="SMS" />
                      </div>
                    </div>

                    <label className="entry__error entry__error--primary" style={{ fontSize: '16px', textAlign: 'left', fontFamily: '"Helvetica", sans-serif', color: '#661d1d', backgroundColor: '#ffeded', borderRadius: '3px', borderColor: '#ff4949' }}>
                    </label>
                    <label className="entry__specification" style={{ fontSize: '12px', textAlign: 'left', fontFamily: '"Helvetica", sans-serif', color: '#8390A4' }}>
                      The SMS field must contain between 6 and 19 digits and include the country code.
                    </label>
                  </div>
                </div>
              </div>
              <div style={{ padding: '8px 0' }}>
                <div className="sib-optin sib-form-block" data-required="true">
                  <div className="form__entry entry_mcq">
                    <div className="form__label-row ">
                      <label className="entry__label" style={{ fontWeight: '700', fontSize: '16px', textAlign: 'left', fontFamily: '"Helvetica", sans-serif', color: '#3c4858' }} htmlFor="RENTORLIST" data-required="*">
                        Which are you interested in?
                      </label>
                      <div className="entry__choice">
                        <label>
                          <input type="radio" name="RENTORLIST" value="1" /> Renting
                        </label>
                      </div>
                      <div className="entry__choice">
                        <label>
                          <input type="radio" name="RENTORLIST" value="2" /> Hosting
                        </label>
                      </div>
                      <div className="entry__choice">
                        <label>
                          <input type="radio" name="RENTORLIST" value="3" /> Both
                        </label>
                      </div>
                    </div>
                    <label className="entry__error entry__error--primary" style={{ fontSize: '16px', textAlign: 'left', fontFamily: '"Helvetica", sans-serif', color: '#661d1d', backgroundColor: '#ffeded', borderRadius: '3px', borderColor: '#ff4949' }}>
                    </label>
                    <label className="entry__specification" style={{ fontSize: '12px', textAlign: 'left', fontFamily: '"Helvetica", sans-serif', color: '#8390A4' }}>
                    </label>
                  </div>
                </div>
              </div>
              <div style={{ padding: '8px 0' }}>
                <div className="sib-form-block" style={{ textAlign: 'left' }}>
                  <button className="sib-form-block__button sib-form-block__button-with-loader" style={{ fontSize: '16px', textAlign: 'left', fontWeight: '700', fontFamily: '"Helvetica", sans-serif', color: '#FFFFFF', backgroundColor: '#a4b99a', borderRadius: '3px', borderWidth: '0px' }} form="sib-form" type="submit">
                    SUBSCRIBE
                  </button>
                </div>
              </div>

              <input type="text" name="email_address_check" value="" className="input--hidden" />
              <input type="hidden" name="locale" value="en" />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedBrevoForm;
