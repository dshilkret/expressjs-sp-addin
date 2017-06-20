import * as passport from 'passport';

import { User } from '../models/user';
import { callbackUrl } from './sharepoint.auth';
import { SharePointAddinStrategy } from '../temp';

import { ISessionUser } from '../common/ISessionUser';
import { IAuthData } from '../temp';
import { ISharePointProfile } from '../temp';
import config from './config';
import { oauthConfig as oauthSettings } from './private.config';

export default function (passport: passport.Passport) {

    // used to serialize the user for the session
    passport.serializeUser((user: ISessionUser, done: any) => {
        done(null, {
            id: user.dbUser.id,
            authData: user.authData
        });
    });

    // used to deserialize the user
    passport.deserializeUser((data: { id: string; authData: IAuthData }, done: any) => {
        User.findById(data.id)
            .then(user => {
                return done(null, {
                    dbUser: user,
                    authData: data.authData
                } as ISessionUser);
            }).catch(done);
    });

    passport.use(new SharePointAddinStrategy(oauthSettings, `${config.appUrl}${callbackUrl}`, (profile: ISharePointProfile) => {
        return User.findOne({ 'sharepoint.name': profile.username })
            .then(user => {
                if (user) {
                    return user;
                }

                let newUser = new User();
                newUser.sharepoint.email = profile.email;
                newUser.sharepoint.name = profile.displayName;
                newUser.sharepoint.username = profile.username;
                return newUser.save();
            })
            .then(user => {
                return {
                    dbUser: user,
                    authData: profile.authData
                }
            });
    }));
};