class PublicationPipeline {

  constructor(){
    this.items=[]
  }

  submit(report){
    report.state="draft"
    this.items.push(report)
  }

  approve(id){
    const r=this.items.find(x=>x.id===id)
    if(r) r.state="approved"
  }

}

module.exports = PublicationPipeline
