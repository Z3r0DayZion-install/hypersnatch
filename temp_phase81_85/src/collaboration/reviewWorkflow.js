class ReviewWorkflow {

  constructor(){
    this.reviews = []
  }

  createReview(caseId, reviewer){
    const r = {
      id: "rev-"+Date.now(),
      caseId,
      reviewer,
      state: "pending",
      comments: []
    }
    this.reviews.push(r)
    return r
  }

  comment(reviewId, text){
    const r = this.reviews.find(x=>x.id===reviewId)
    if(r) r.comments.push({text,ts:Date.now()})
  }

}

module.exports = ReviewWorkflow
