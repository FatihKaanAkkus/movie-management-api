import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockContext: jest.Mocked<ExecutionContext>;

  beforeEach(() => {
    reflector = { get: jest.fn() } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
    mockContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn(),
      getHandler: jest.fn(),
    } as unknown as jest.Mocked<ExecutionContext>;
  });

  it('should allow if no required roles are set', () => {
    (reflector.get as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow if user has required role', () => {
    (reflector.get as jest.Mock).mockReturnValue(['manager', 'customer']);
    mockContext.getRequest.mockReturnValue({ user: { role: 'manager' } });
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should deny if user does not have required role', () => {
    (reflector.get as jest.Mock).mockReturnValue(['manager']);
    mockContext.getRequest.mockReturnValue({ user: { role: 'customer' } });
    expect(guard.canActivate(mockContext)).toBe(false);
  });

  it('should deny if user is missing on request', () => {
    (reflector.get as jest.Mock).mockReturnValue(['manager']);
    mockContext.getRequest.mockReturnValue({});
    expect(guard.canActivate(mockContext)).toBe(false);
  });

  it('should deny if user.role is missing', () => {
    (reflector.get as jest.Mock).mockReturnValue(['manager']);
    mockContext.getRequest.mockReturnValue({ user: {} });
    expect(guard.canActivate(mockContext)).toBe(false);
  });
});
