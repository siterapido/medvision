export default function CursosPage() {
  return (
    <div className="h-full flex flex-col p-8">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-2">Cursos</h1>
        <p className="text-muted-foreground mb-8">Acesse cursos de odontologia e aprimore seus conhecimentos</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted"></div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">Curso de Odontologia {i}</h3>
                <p className="text-sm text-muted-foreground mb-4">Aprenda técnicas avançadas de tratamento dental</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">12 aulas</span>
                  <span className="text-xs font-medium text-primary">Iniciar</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
