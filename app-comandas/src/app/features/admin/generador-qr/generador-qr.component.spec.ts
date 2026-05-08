import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GeneradorQrComponent } from './generador-qr.component';

describe('GeneradorQrComponent', () => {
  let component: GeneradorQrComponent;
  let fixture: ComponentFixture<GeneradorQrComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GeneradorQrComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneradorQrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
