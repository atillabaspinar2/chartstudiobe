import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(
    fullName: string,
    email: string,
    passwordHash: string,
  ): Promise<User> {
    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const user = this.usersRepository.create({
      fullName,
      email,
      passwordHash,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<
    Pick<User, 'id' | 'fullName' | 'email' | 'createdAt'>[]
  > {
    return this.usersRepository.find({
      select: ['id', 'fullName', 'email', 'createdAt'],
    });
  }
}
