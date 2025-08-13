// firebase-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from 'src/user/user.service';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    constructor(private readonly firebaseService: FirebaseService, private readonly userService: UserService,private jwtService: JwtService,private reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;
    
    const JWT_SECRET = process.env.JWT_SECRET
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request)
    let sessionCookie : string | undefined;
    if(token){
      const payload = await this.jwtService.verifyAsync(token,{
        secret: JWT_SECRET
      })
      sessionCookie = payload.sub
    }else{
      sessionCookie = this.extractTokenFromRequest(request)
    }

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

  private extractTokenFromRequest(request: Request): string | undefined {
    if(request && request.signedCookies){
      return request.signedCookies.syna_session
    }
    if(request && request.cookies){
      return request.cookies.syna_session
    }
    return undefined
  }

  private extractTokenFromHeader(req: Request): string | null {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
}
}