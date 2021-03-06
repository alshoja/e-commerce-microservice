import * as bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as jwt from 'jsonwebtoken';

import HttpException from '../exceptions/HttpErrorException';
import { User } from '../models/User.model';

export class UserController {
  public getUsers(req: Request, res: Response, next: NextFunction): any {
    User.find()
      .then((users) => {
        res.status(200).json({ users: users });
      })
      .catch((err) => {
        if (!err.status) {
          err.status = 500;
        }
        next(err);
      });
  }

  public getUser(req: Request, res: Response, next: NextFunction): any {
    const userId = req.params.userId;
    User.findById(userId)
      .then((user) => {
        if (!user) {
          next(new HttpException(404, 'User not found', res));
        }
        res.status(200).json({ user: user });
      })
      .catch((err) => {
        if (!err.status) {
          err.status = 500;
        }
        next(err);
      });
  }

  public addUser(req: Request, res: Response, next: NextFunction): any {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: validationErrors.array(),
      });
    }

    bcrypt
      .hash(req.body.password, 12)
      .then((hashedPw) => {
        const user = new User({
          name: req.body.name,
          username: req.body.username,
          password: hashedPw,
        });
        user.save().then((user: any) => {
          const token = jwt.sign(
            {
              email: user.email,
              userId: user._id.toString(),
            },
            'secret',
            { expiresIn: '24h' }
          );
          res.status(200).json({ token: token, userId: user._id.toString() });
        });
      })
      .catch((err) => {
        if (!err.status) {
          err.status = 500;
        }
        next(err);
      });
  }

  public updateUser(req: Request, res: Response, next: NextFunction): any {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: validationErrors.array(),
      });
    }
    const userId = req.params.userId;
    User.findById(userId)
      .then((user: any) => {
        if (!user) {
          next(new HttpException(404, 'User not found', res));
        }
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        return user.save();
      })
      .then((user) => {
        res.status(200).json({ message: 'User updated !', user: user });
      })
      .catch((err) => {
        if (!err.status) {
          err.status = 500;
        }
        next(err);
      });
  }

  public deleteUser(req: Request, res: Response, next: NextFunction): any {
    const userId = req.params.userId;
    User.findById(userId).then((user) => {
      if (!user) {
        next(new HttpException(404, 'User not found', res));
      }
      return User.findByIdAndRemove(userId)
        .then((user) => {
          res.status(200).json({ message: 'User deleted', user: user });
        })
        .catch((err) => {
          if (!err.status) {
            err.status = 500;
          }
          next(err);
        });
    });
  }
}
