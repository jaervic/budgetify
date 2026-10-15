import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SPECIALTIES,
  DOCTOR_TITLES,
  doctorFullName,
  specialtyName,
} from './specialties'

describe('áreas de práctica', () => {
  it('todas tienen id, nombre y al menos un título', () => {
    for (const specialty of DEFAULT_SPECIALTIES) {
      expect(specialty.id).toBeTruthy()
      expect(specialty.name).toBeTruthy()
      expect(specialty.titles.length).toBeGreaterThan(0)
    }
    expect(new Set(DEFAULT_SPECIALTIES.map((s) => s.id)).size).toBe(
      DEFAULT_SPECIALTIES.length,
    )
  })

  it('resuelve el nombre del área por su id', () => {
    expect(specialtyName('odontologia')).toBe('Odontología')
    expect(specialtyName('traumatologia')).toBe('Traumatología y Ortopedia')
    expect(specialtyName('no-existe')).toBeUndefined()
    expect(specialtyName(undefined)).toBeUndefined()
  })

  it('respeta la lista de áreas que le pasen', () => {
    const custom = [{ id: 'x', name: 'Mi área', titles: [] }]
    expect(specialtyName('x', custom)).toBe('Mi área')
    expect(specialtyName('odontologia', custom)).toBeUndefined()
  })

  it('ofrece los títulos más comunes', () => {
    expect(DOCTOR_TITLES).toContain('Dr.')
    expect(DOCTOR_TITLES).toContain('Dra.')
    expect(DOCTOR_TITLES).toContain('Od.')
    expect(DOCTOR_TITLES).toContain('Odra.')
    expect(DOCTOR_TITLES).toContain('Lcda.')
  })
})

describe('doctorFullName', () => {
  it('junta título y nombre', () => {
    expect(doctorFullName('Dr.', 'Juan Pérez')).toBe('Dr. Juan Pérez')
    expect(doctorFullName('Odra.', 'Ana Rojas')).toBe('Odra. Ana Rojas')
  })

  it('no repite el título si el nombre ya lo trae', () => {
    expect(doctorFullName('Dr.', 'Dr. Juan Pérez')).toBe('Dr. Juan Pérez')
    expect(doctorFullName('Dr.', 'DR JUAN PEREZ')).toBe('DR JUAN PEREZ')
    expect(doctorFullName('Od.', 'Od. Ana Rojas')).toBe('Od. Ana Rojas')
  })

  it('funciona cuando falta alguna de las dos partes', () => {
    expect(doctorFullName(undefined, 'Juan Pérez')).toBe('Juan Pérez')
    expect(doctorFullName('Dr.', undefined)).toBe('Dr.')
    expect(doctorFullName('  Dr.  ', '  Juan  ')).toBe('Dr. Juan')
    expect(doctorFullName(undefined, undefined)).toBe('')
  })
})
