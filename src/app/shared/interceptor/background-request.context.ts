import {HttpContextToken} from '@angular/common/http';

/** Keeps long-running background reads out of the full-screen HTTP loader. */
export const BACKGROUND_REQUEST = new HttpContextToken<boolean>(() => false);
