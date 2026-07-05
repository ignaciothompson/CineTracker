import { useState } from 'react';

import { useLibraryContext } from '../context/AppContext';

import { EmptyState } from './EmptyState';

import './Views.css';



export function ListsView() {

  const { lists, createList, deleteList } = useLibraryContext();

  const [name, setName] = useState('');

  const [description, setDescription] = useState('');

  const [showForm, setShowForm] = useState(false);

  const [saving, setSaving] = useState(false);



  const handleCreate = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!name.trim() || saving) return;

    setSaving(true);

    const ok = await createList(name, description);

    setSaving(false);

    if (ok) {

      setName('');

      setDescription('');

      setShowForm(false);

    }

  };



  return (

    <>

      <div className="lists-toolbar">

        <button

          type="button"

          className="btn"

          onClick={() => setShowForm((v) => !v)}

        >

          {showForm ? 'Cancelar' : 'Nueva lista'}

        </button>

      </div>



      {showForm ? (

        <form className="list-form" onSubmit={(e) => void handleCreate(e)}>

          <div className="field">

            <label htmlFor="list-name">Nombre</label>

            <input

              id="list-name"

              type="text"

              value={name}

              onChange={(e) => setName(e.target.value)}

              placeholder="Ej: Para ver en pareja"

              autoFocus

              required

            />

          </div>

          <div className="field">

            <label htmlFor="list-desc">Descripción (opcional)</label>

            <input

              id="list-desc"

              type="text"

              value={description}

              onChange={(e) => setDescription(e.target.value)}

              placeholder="Notas sobre la lista"

            />

          </div>

          <button type="submit" className="btn" disabled={saving || !name.trim()}>

            {saving ? 'Creando...' : 'Crear lista'}

          </button>

        </form>

      ) : null}



      {!lists.length && !showForm ? (

        <EmptyState icon="📋" text="No hay listas todavía. Creá una con el botón de arriba." />

      ) : null}



      {lists.map((l) => (

        <div key={l.id} className="list-card">

          <div className="list-card-head">

            <h3>{l.name}</h3>

            <button

              type="button"

              className="btn ghost list-delete"

              onClick={() => {

                if (window.confirm(`¿Eliminar la lista "${l.name}"?`)) {

                  void deleteList(l.id);

                }

              }}

            >

              Eliminar

            </button>

          </div>

          {l.description ? <div className="list-desc">{l.description}</div> : null}

          <div className="items">

            {(l.items || []).length

              ? (l.items || []).map((i) => i.name).join(' · ')

              : 'Lista vacía.'}

          </div>

        </div>

      ))}

    </>

  );

}

