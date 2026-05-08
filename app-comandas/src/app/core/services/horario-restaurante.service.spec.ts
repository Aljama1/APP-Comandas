import { TestBed } from '@angular/core/testing';

import { HorarioRestaurante } from './horario-restaurante';

describe('HorarioRestaurante', () => {
  let service: HorarioRestaurante;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HorarioRestaurante);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
