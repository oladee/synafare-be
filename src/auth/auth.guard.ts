// firebase-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from 'src/user/user.service';
import { FirebaseService } from 'src/utils/firebase/firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    constructor(private readonly firebaseService: FirebaseService, private readonly userService: UserService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionCookie = request.signedCookies?.['syna_session'];

    if (!sessionCookie) {
      throw new UnauthorizedException('Session cookie not found');
    }

    try {
      const {email}= await this.firebaseService.verifySessionCookie(sessionCookie, true);
      const {userDetails} = await this.userService.findOne({email})
      if(userDetails)request['user'] = userDetails; // Attach user info to request
      return true;
    } catch (err) {
      console.log(err)
      throw new UnauthorizedException('Invalid or expired session cookie');
    }
  }
}