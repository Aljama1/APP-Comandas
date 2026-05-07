import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import * as fireAuth from '@angular/fire/auth';
import { adminGuard } from './admin.guard';
import { of, throwError } from 'rxjs';

describe('adminGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;
  let authMock: any;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);
    authMock = {};

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: Auth, useValue: authMock }
      ]
    });
  });

  const runGuard = async () => {
    return TestBed.runInInjectionContext(() => {
      const mockRoute = {} as ActivatedRouteSnapshot;
      const mockState = { url: '/admin/dashboard' } as RouterStateSnapshot;
      return adminGuard(mockRoute, mockState);
    });
  };

  it('should allow access if user is authenticated and NOT anonymous', async () => {
    (authMock as any) = {
      currentUser: { isAnonymous: false }
    };
    spyOn(fireAuth, 'authState').and.returnValue(of({ isAnonymous: false }) as any);

    const result = await runGuard();
    expect(result).toBeTrue();
  });

  it('should redirect to login if user is anonymous', async () => {
    spyOn(fireAuth, 'authState').and.returnValue(of({ isAnonymous: true }) as any);
    routerSpy.createUrlTree.and.returnValue({} as any);

    const result = await runGuard();
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/admin/login'], { queryParams: { returnUrl: '/admin/dashboard' } });
  });

  it('should redirect to login if user is not authenticated (null)', async () => {
    spyOn(fireAuth, 'authState').and.returnValue(of(null) as any);
    routerSpy.createUrlTree.and.returnValue({} as any);

    const result = await runGuard();
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/admin/login'], { queryParams: { returnUrl: '/admin/dashboard' } });
  });

  it('should redirect to login if authState throws an error', async () => {
    spyOn(fireAuth, 'authState').and.returnValue(throwError(() => new Error('Auth error')));
    routerSpy.createUrlTree.and.returnValue({} as any);

    const result = await runGuard();
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/admin/login'], { queryParams: { returnUrl: '/admin/dashboard' } });
  });
});
