/**
 * Pagine web pubblicate su Netlify (sorgenti in web/).
 * Per aggiornarle: ricaricare la cartella web/ su Netlify (progetto resetappbusiness).
 */
const SITE = 'https://resetappbusiness.netlify.app';

export const LEGAL_LINKS = {
  site: SITE,
  terms: `${SITE}/termini.html`,
  privacy: `${SITE}/privacy.html`,
  deleteAccount: `${SITE}/elimina-account.html`,
} as const;
