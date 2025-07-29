import { HttpException, Injectable } from '@nestjs/common';
// import * as admin from 'firebase-admin';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from 'src/firebase/firebase.service';
import { loginDto } from './dto/login.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private configService: ConfigService,private readonly firebaseService: FirebaseService,) {}

  async login(loginData: loginDto, res:Response) {
    try {
        const {idToken,role} =loginData
      const decoded = await this.firebaseService.verifyIdToken(idToken);
      const userRecord = await this.firebaseService.getUser(decoded.uid);

      const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days

      console.log(userRecord)

      const { uid, email, name, picture } = decoded;

      const user = await this.userService.findOrCreate(
        { firebaseUid: uid },
        {
            firebaseUid: uid,
            email: email,
            name: name,
            role,
            avatar: picture,
        }
        );
        
        const sessionCookie = await this.firebaseService.createSessionCookie(idToken,expiresIn);

      await this.firebaseService.verifySessionCookie(sessionCookie, true);
        res.cookie('syna_session', sessionCookie, {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') == "dev" ? false : true,
        sameSite: 'none',
        signed : true,
        maxAge: expiresIn,
        });


      return { message: 'Login successful', user };
    } catch (err) {
        console.log(err)
        throw new HttpException(err.message || 'Invalid ID token/Bad Request', 400)
    }
  }
}